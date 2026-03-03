'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API = 'http://localhost:3000/api';

export async function loginAction(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const redirectTo = formData.get('redirect') as string || '/problems';

    const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { error: err.message || 'Invalid email or password' };
    }

    const data = await res.json();
    const jar = await cookies();

    const opts = { httpOnly: false, secure: false, path: '/', maxAge: 60 * 60 * 24 * 7 } as const;
    jar.set('coderly_token', data.accessToken, { ...opts, httpOnly: true });
    jar.set('coderly_uid', data.userId, opts);
    jar.set('coderly_uname', encodeURIComponent(data.username), opts);

    redirect(redirectTo);
}

export async function registerAction(formData: FormData) {
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { error: err.message || 'Registration failed' };
    }

    // Auto-login after registration
    const loginRes = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    if (loginRes.ok) {
        const data = await loginRes.json();
        const jar = await cookies();
        const opts = { httpOnly: false, secure: false, path: '/', maxAge: 60 * 60 * 24 * 7 } as const;
        jar.set('coderly_token', data.accessToken, { ...opts, httpOnly: true });
        jar.set('coderly_uid', data.userId, opts);
        jar.set('coderly_uname', encodeURIComponent(data.username), opts);
    }

    redirect('/problems');
}

export async function logoutAction() {
    const jar = await cookies();
    jar.delete('coderly_token');
    jar.delete('coderly_uid');
    jar.delete('coderly_uname');
    redirect('/');
}
