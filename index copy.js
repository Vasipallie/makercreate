import express from 'express';
import cookieParser from 'cookie-parser';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
dotenv.config();
const __dirname = dirname(fileURLToPath(import.meta.url));
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;
const hackClubAuthClientId = process.env.HACKCLUB_AUTH_CLIENT_ID || 'c64a336b6421768c772ca0b711d5e81e';
const hackClubAuthClientSecret = process.env.HACKCLUB_AUTH_CLIENT_SECRET;
const hackClubAuthRedirectUri = process.env.HACKCLUB_AUTH_REDIRECT_URI || `http://localhost:${PORT}/authenticate`;
const hackClubAuthScopes = 'email name verification_status slack_id';
const sessionCookieName = 'makercreate_session';
const sessionCookieMaxAge = 1000 * 60 * 60 * 24 * 30;
const isProduction = process.env.NODE_ENV === 'production';
const authSessions = new Map();

app.use(cookieParser());
app.use('/models', express.static(path.join(__dirname, 'views', 'resources', 'models')));
app.use('/three', express.static(path.join(__dirname, 'node_modules', 'three')));
app.use(express.static(path.join(__dirname, 'views')));

app.set('view engine', 'ejs');



app.get('/', (req, res) => {
    res.render('index');
}
);

function getSession(req) {
    const sessionId = req.cookies[sessionCookieName];
    if (!sessionId) {
        return null;
    }

    return authSessions.get(sessionId) || null;
}

function setSessionCookie(res, sessionId) {
    res.cookie(sessionCookieName, sessionId, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
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

function buildDisplayName(identity = {}) {
    const parts = [identity.first_name, identity.last_name].filter(Boolean);
    if (parts.length > 0) {
        return parts.join(' ');
    }

    return identity.primary_email || identity.id || 'Authenticated user';
}

async function exchangeCodeForToken(code) {
    const response = await fetch('https://auth.hackclub.com/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            client_id: hackClubAuthClientId,
            client_secret: hackClubAuthClientSecret,
            redirect_uri: hackClubAuthRedirectUri,
            code,
            grant_type: 'authorization_code',
        }),
    });

    const payload = await response.json();

    if (!response.ok) {
        const message = payload?.error_description || payload?.error || 'Unable to exchange authorization code.';
        throw new Error(message);
    }

    return payload;
}

async function fetchIdentity(accessToken) {
    const response = await fetch('https://auth.hackclub.com/api/v1/me', {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    const payload = await response.json();

    if (!response.ok) {
        const message = payload?.error?.message || payload?.message || 'Unable to fetch Hack Club identity.';
        throw new Error(message);
    }

    return payload;
}

app.get('/dashboard', (req, res) => {
    const session = getSession(req);

    if (!session) {
        return res.redirect('/login');
    }

    const identity = session.identity?.identity || {};

    return res.render('dashboard', {
        name: buildDisplayName(identity),
        log: 0,
        verificationStatus: identity.verification_status || 'unknown',
        email: identity.primary_email || '',
    });
});

app.get('/console', (req, res) => {
    res.render('console');
});

app.get('/login', (req, res) => {
    const authUrl = new URL('https://auth.hackclub.com/oauth/authorize');
    authUrl.searchParams.set('client_id', hackClubAuthClientId);
    authUrl.searchParams.set('redirect_uri', hackClubAuthRedirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', hackClubAuthScopes);

    res.redirect(authUrl.toString());
});

app.get('/authenticate', async (req, res) => {
    const { error, code } = req.query;

    if (error) {
        return res.status(401).send('Hack Club Auth did not complete. Please try again from /login.');
    }

    if (!code || typeof code !== 'string') {
        return res.redirect('/login');
    }

    if (!hackClubAuthClientSecret) {
        return res.status(500).send('Missing HACKCLUB_AUTH_CLIENT_SECRET.');
    }

    try {
        const tokenPayload = await exchangeCodeForToken(code);
        const identityPayload = await fetchIdentity(tokenPayload.access_token);
        const sessionId = randomUUID();

        authSessions.set(sessionId, {
            token: tokenPayload,
            identity: identityPayload,
            createdAt: Date.now(),
        });

        setSessionCookie(res, sessionId);
        return res.redirect('/dashboard');
    } catch (error) {
        return res.status(401).send(error instanceof Error ? error.message : 'Hack Club Auth failed.');
    }
});

app.get('/logout', (req, res) => {
    const sessionId = req.cookies[sessionCookieName];

    if (sessionId) {
        authSessions.delete(sessionId);
    }

    clearSessionCookie(res);
    return res.redirect('/');
});

//START SERVER
app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT}`);
})


/* 

https://auth.hackclub.com/oauth/authorize?client_id=c64a336b6421768c772ca0b711d5e81e&redirect_uri=http://localhost:3000/authenticate&response_type=code&scope=email

*/