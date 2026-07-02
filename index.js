//Imports
    import express from 'express';
    import cookieParser from 'cookie-parser';
    import { dirname } from 'path';
    import { randomUUID } from 'crypto';
    import { fileURLToPath } from 'url';
    import Airtable from "airtable";
    import dotenv from 'dotenv';
    dotenv.config();
    const __dirname = dirname(fileURLToPath(import.meta.url));
    import path from 'path';

//AIRTABLE INIT
    const rsvp = new Airtable({
    apiKey: process.env.AirTableAPIK,
    }).base(process.env.AirTableBID);

//MIDDLEWARE
    const app = express();
    app.use(cookieParser());
    app.use('/models', express.static(path.join(__dirname, 'views', 'resources', 'models')));
    app.use('/three', express.static(path.join(__dirname, 'node_modules', 'three')));
    app.use(express.static(path.join(__dirname, 'views')));
    app.set('view engine', 'ejs');

    //MIDDLEWARE f(x)
    //sanitise error/:id stuff as its being shown on screen and can be used for XSS attacks 
    function disinfect(string) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        "/": '&#x2F;',
    };
    const reg = /[&<>"'/]/ig;
    return string.replace(reg, (match)=>(map[match]));
    }
    //Exchange Code for Token system via HCA
    async function eC4T(code) {
        const response = await fetch('https://auth.hackclub.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: HCA_CID,
                client_secret: HCA_SID,
                redirect_uri: RedirectUri,
                code,
                grant_type: 'authorization_code',
            }),
        });
        const payload = await response.json();

        if (!response.ok) {
            const message = payload?.error_description || payload?.error || 'Auth Code Xchange Fail';
            throw new Error(message);
        }
        return payload;
    };
    // Fetch their identity from access Tkn
    async function fetchIdenti(accessToken) {
        const response = await fetch('https://auth.hackclub.com/api/v1/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        const payload = await response.json();
        if (!response.ok) {
            const message = payload?.error?.message || payload?.message || 'Unable to fetch Hack Club identity.';
            throw new Error(message);
        }
        return payload
    }
    //Convert humongously large log counts to a readable format like roadblocks (:P)
    function countfx(num){
        if (num >= 1000000){
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000){
            return (num / 1000).toFixed(1) + 'K';
        }
        return num;
    }

// Declaring imporantant variables for auth and sesh mgmt
    const PORT = process.env.PORT || 3000;
    const HCA_CID = process.env.HCA_CID;
    const HCA_SID = process.env.HCA_SID;
    const HCAScope = 'email name verification_status slack_id';
    const sessionCookieName = 'makercreate_session';
    const sessionCookieMaxAge = 1000 * 60 * 60 * 24 * 30;
    const isProduction = true;
    const RedirectUri = process.env.HACKCLUB_AUTH_REDIRECT_URI || `http://localhost:${PORT}/authenticate`;
    const authSessions = new Map();

//SLACK INIT
    import { WebClient } from "@slack/web-api";
    const client = new WebClient(process.env.SlackBT);
    // Get the pfp of a hackclub slack member based on thier registered slack ID
    async function getPfp(slackID) {
        const { user } = await client.users.info({ user: slackID });
        return user.profile.image_512;
    }

// Authentication and sesh mgmt
    function setSessionCookie(res, sessionId) {
        res.cookie(sessionCookieName, sessionId, {
            httpOnly: true,
            sameSite: 'lax',
            secure: isProduction,
            maxAge: sessionCookieMaxAge,
        });
    }
    function clearSessionCookie(res) {
        res.clearCookie(sessionCookieName, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
        });
    }
    function getSession(req) {
        const sessionId = req.cookies[sessionCookieName];
        if (!sessionId) {
            return null;
        }
        return authSessions.get(sessionId) || null;
    }

// APP ROUTES
    app.get('/', (req, res) => {
        res.render('index');
    }
    );
    app.get('/dashboard', async (req, res) => {
        const session = getSession(req);
        if (!session) {
            return res.redirect('/login');
        }
        const identity = session.identity?.identity || {};
        if (identity.verification_status === 'ineligible') {
            return res.redirect('/error/You are not eligible to use the MakerCreate Console.');
        }
        console.log(identity)
        const url = await getPfp(identity.slack_id);

        const logs = countfx(0); // From Airtable once i get it working :(
        res.render('dashboard', {
            name: identity.first_name || 'UnRetrievable',
            email: identity.primary_email || 'UnRetrievable',
            slackId: identity.slack_id || 'UnRetrievable',
            verificationStatus: identity.verification_status || 'UnRetrievable',
            pfp: url,
            log: logs

        });
    });
    app.get('/login', (req,res) => {
        const authUrl = new URL('https://auth.hackclub.com/oauth/authorize');
        authUrl.searchParams.set('client_id', HCA_CID);
        authUrl.searchParams.set('redirect_uri', RedirectUri);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', HCAScope);
        res.redirect(authUrl.toString());

    });

    app.get('/authenticate', async (req, res) => {
        const {error, code} = req.query;
        if (error) {
            return res.redirect(`/error/${error}`);
        }
        if (!code) {
            return res.redirect('/error/Auth Code not provided');
        }
        
        if (typeof code !== 'string') {
            return res.redirect('/login');
        }
        if (!HCA_CID && !HCA_SID) {
            return res.redirect('/error/Missing authentication credentials');
        }
        try {
            const token = await eC4T(code);
            const identity = await fetchIdenti(token.access_token);
            const sessionId = randomUUID();
            authSessions.set(sessionId, {
                token,
                identity,
                createdAt: Date.now(),
            });
            setSessionCookie(res, sessionId);
            return res.redirect('/dashboard');

        }catch (error){
            return res.redirect(`/error/${error.message}`);
        }
    });

    app.get('/logout', (req,res) => {
        const sessionId = req.cookies.sessionId;
        if (sessionId) {
            authSessions.delete(sessionId);
            res.clearCookie('sessionId');
        }
        res.redirect('/');
    });

    app.get('/error/:msg', (req, res) => {
        res.render('err', { message: disinfect(req.params.msg) });
    });
    app.get('/:404', (req, res) => {
        res.redirect('/error/Error 404, Page Not Found');
    });


//START SERVER
app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT}`);
})