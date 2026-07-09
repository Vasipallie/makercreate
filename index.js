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
Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: process.env.AirTableAPIK
});
const base = Airtable.base(process.env.AirTableBID);
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
    async function xchangecode(code, redirectUri) {
        const tokenBody = new URLSearchParams({
            client_id: HaktimeUID,
            code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        });
        if (HaktimeAPIK) {
            tokenBody.set('client_secret', HaktimeAPIK);
        }
        const response = await fetch('https://hackatime.hackclub.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: tokenBody,
        });
        const payload = await response.json();

        if (!response.ok) {
            const message = payload?.error_description || payload?.error || 'Hackatime token exchange failed';
            const error = new Error(message);
            error.statusCode = response.status;
            error.payload = payload;
            throw error;
        }
        return payload;
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
    async function dashauth(req, res) {
        const session = getSession(req);
        if (!session) {
            res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
            return null;
        }
        const identity = session.identity?.identity || {};
        if (identity.verification_status === 'ineligible') {
            res.redirect('/error/You are not eligible to use the MakerCreate Console.');
            return null;
        }
        let url = 'resources/pfp.jpg';
        if (identity.slack_id) {
            try {
                url = await getPfp(identity.slack_id);
            } catch {
                url = 'resources/pfp.jpg';
            }
        }

        const logs = countfx(0); // From Airtable once i get it working :(

        return {
            fname: identity.first_name || 'UnRetrievable',
            lname: identity.last_name || 'UnRetrievable',
            email: identity.primary_email || 'UnRetrievable',
            slackId: identity.slack_id || 'UnRetrievable',
            verif: identity.verification_status || 'UnRetrievable',
            pfp: url,
            log: logs
        }
    }
    async function hkcookiechk(slackid){
        if (!slackid){
            return false;
        }
        try {
            const existing = await base('Users').select({
                filterByFormula: `{SlackId} = "${slackid}"`,
                maxRecords: 1
            })
            .firstPage();
            if (existing.length > 0) {
                const record = existing[0];
                const stoken = record.get('HackatimeToken');
                return !!stoken;
            } else {
                return false;
            }
        } catch (err) {
            console.error('Airtable Hackatime error:', err.message, err.statusCode ?? '');
            return false;
        }
    }
// Declaring imporantant variables for auth and sesh mgmt
    const PORT = process.env.PORT || 3000;
    const HCA_CID = process.env.HCA_CID;
    const HCA_SID = process.env.HCA_SID;
    const HaktimeUID = process.env.HaktimeUID; 
    const HaktimeAPIK = process.env.HaktimeAPIK;
    const HCAScope = 'email name verification_status slack_id';
    const sessionCookieName = 'makercreate_session';
    const sessionCookieMaxAge = 1000 * 60 * 60 * 24 * 30;
    const isProduction = process.env.NODE_ENV === 'production';
    const RedirectUri = process.env.HACKCLUB_AUTH_REDIRECT_URI || `http://localhost:${PORT}/authenticate`;
    const HackatimeRedirectUri = process.env.HAKTIME_AUTH_REDIRECT_URI;
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
    async function rsvpdbs(identity) {
        const info = identity?.identity || {};
        const fname = info.first_name || 'UnRetrievable';
        const email = info.primary_email || 'UnRetrievable';
        const slackId = info.slack_id || 'UnRetrievable';

        if (email === 'UnRetrievable' || slackId === 'UnRetrievable' || fname === 'UnRetrievable' ) {
            return;
        }
        try {
            const existing = await base('RSVPs')
                .select({
                    filterByFormula: `{SlackId} = "${slackId}"`,
                    maxRecords: 1
                })
                .firstPage();

            if (existing.length > 0) {
                return;
            }
            const records = await base('RSVPs').create([
                {
                    fields: {
                        Name: fname,
                        Email: email,
                        SlackID: slackId
                    }
                }
            ]);
            records.forEach((record) => {
                console.log('Created RSVP record:', record.getId());
            });
        } catch (err) {
            console.error('Airtable RSVP error:', err.message, err.statusCode ?? '');
        }
    }
    async function userdbs(identity){
        const info = identity?.identity || {};
        const fname = info.first_name || 'UnRetrievable';
        const email = info.primary_email || 'UnRetrievable';
        const slackId = info.slack_id || 'UnRetrievable';
        if (email === 'UnRetrievable' || slackId === 'UnRetrievable' || fname === 'UnRetrievable' ) {
            return false;
        }
        try {
            const existing = await base('Users').select({
                filterByFormula: `{SlackId} = "${slackId}"`,
                maxRecords: 1
            }).firstPage();
            if (existing.length > 0) {
                return true;
            }
            await base('Users').create({
                SlackId: slackId,
                Name: fname,
                Email: email
            });
            return true;

        } catch (err) {
            console.error('Airtable Users error:', err.message, err.statusCode ?? '');
            throw err;
        }
    }

// APP ROUTES
    app.get('/authenticate', async (req, res) => {
        const {error, code, state} = req.query;
        if (error) {
            return res.redirect(`/error/Other Auth ERR:${error}`);
        }
        if (!code) {
            return res.redirect('/error/Auth Code not provided');
        }

        if (typeof code !== 'string') {
            return res.redirect('/login');
        }
        if (!HCA_CID || !HCA_SID) {
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
            console.log(
                identity.identity?.primary_email,
                identity.identity?.first_name,
                identity.identity?.last_name,
                identity.identity?.slack_id
            );
            await rsvpdbs(identity);
            const userCreated = await userdbs(identity);
            if (!userCreated) {
                return res.redirect('/error/Unable to register user in database');
            }
            const nextPage = typeof state === 'string' && state.startsWith('/') ? state : '/dashboard';
            return res.redirect(nextPage);

        }catch (error){
            const message = error instanceof Error ? error.message : String(error);
            return res.redirect(`/error/Auth Error:${message}`);
        }
    });
    app.get('/', (req, res) => {
        res.render('index');
    }
    );
    app.get('/dashboard', async (req, res) => {
        const data = await dashauth(req, res);
        if (!data) {
            return;
        }
        const linked = await hkcookiechk(data.slackId);

        res.render('dashboard', {
            name: data.fname,
            email: data.email,
            slackId: data.slackId,
            verificationStatus: data.verif,
            pfp: data.pfp,
            log: data.log,
            linked

        });
    });
    app.get('/makershop', async (req, res)=>{
        res.render('makershop', {linked: false});
    })
    app.get('/hackatimeauth', async (req,res)=>{
        const nextPage = typeof req.query.next === 'string' && req.query.next.startsWith('/')
            ? req.query.next
            : '/dashboard';
        const config = getHackatimeConfig(req);
        const authUrl = new URL('https://hackatime.hackclub.com/oauth/authorize');
        authUrl.searchParams.set('client_id', config.uid);
        const protocol = (req.headers['x-forwarded-proto'] || req.protocol).split(',')[0].trim();
        const host = req.get('host');
        const redirectUri = config.redirectUri || `${protocol}://${host}/hackatime`;
        console.log('[DEBUG AUTH] Host:', host, 'Protocol:', protocol, 'Constructed redirectUri:', redirectUri, 'config.uid:', config.uid);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', 'profile read');
        authUrl.searchParams.set('state', nextPage);
        res.redirect(authUrl.toString());
    })
    app.get('/settings', async (req, res) => {
        const data = await dashauth(req, res);
        if (!data) {
            return;
        }
        res.render('settings', {
            name: data.fname,
            lname: data.lname,
            email: data.email,
            slackId: data.slackId,
            verificationStatus: data.verif,
            pfp: data.pfp,
            ysws: data.verif,
            log: data.log,
            linked: await hkcookiechk(data.slackId)
        });
    });
    app.get('/login', (req,res) => {
        const nextPage = typeof req.query.next === 'string' && req.query.next.startsWith('/')
            ? req.query.next
            : '/dashboard';
        const authUrl = new URL('https://auth.hackclub.com/oauth/authorize');
        authUrl.searchParams.set('client_id', HCA_CID);
        authUrl.searchParams.set('redirect_uri', RedirectUri);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', HCAScope);
        authUrl.searchParams.set('state', nextPage);
        res.redirect(authUrl.toString());

    });
    app.get('/logout', (req,res) => {
        const sessionId = req.cookies[sessionCookieName];
        if (sessionId) {
            authSessions.delete(sessionId);
            clearSessionCookie(res);
        }
        res.redirect('/');
    });
    app.get('/error/:msg', (req, res) => {
        res.render('err', { message: disinfect(req.params.msg) });
    });
    async function hakcall(req, res) {
        const code = req.query.code;
        const nextPage = typeof req.query.state === 'string' && req.query.state.startsWith('/')
            ? req.query.state
            : '/dashboard';
        if (typeof code !== 'string' || !code) {
            return res.redirect('/error/HTC: Hackatime authorization code not provided');
        }
        try{
            const protocol = (req.headers['x-forwarded-proto'] || req.protocol).split(',')[0].trim();
            const redirectUri = `${protocol}://${req.get('host')}${req.path}`;
            const token = await xchangecode(code, redirectUri);
            const accessToken = token.access_token;

            if (!accessToken) {
                return res.redirect('/error/HTC: Hackatime access token not provided');
            }
            const data = await dashauth(req, res);
            if (!data) {
                return;
            }

            const slackId = data.slackId;
            if (!slackId) {
                return res.redirect('/error/HTC: Unable to retrieve slack ID for user');
            }
            const existing = await base('Users').select({
                filterByFormula: `{SlackId} = "${slackId}"`,
                maxRecords: 1
            }).firstPage();

            if (existing.length > 0) {
                //check if access tok is already stored
                const record = existing[0];
                const stoken = record.get('HackatimeToken');
                if (stoken){
                    return res.redirect(nextPage);
                }
                else{
                    await base('Users').update(record.id, {
                        'HackatimeToken': accessToken
                    });
                    return res.redirect(nextPage);
                }
            } else {

                return res.redirect('/error/HTC: Unable to find user in database');
            }
        } catch (err) {
            console.error('Hackatime token exchange err:', err.message, err.statusCode ?? '', err.payload ?? '');
            return res.redirect('/error/HTC: Hackatime token exchange failed: ' + err.message);
        }
    }
    app.get('/hackatime', hakcall);
    app.get('/hackatimecallback', hakcall);
    app.get('*', (req, res) => {
        res.redirect('/error/Error 404, Page Not Found');
    });

//START SERVER
const server = app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
    server.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
});