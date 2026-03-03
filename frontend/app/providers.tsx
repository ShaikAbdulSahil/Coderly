'use client';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { useEffect } from 'react';
import { setAuth } from '@/store';

function AuthHydrator({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Rehydrate auth from cookie (token is readable by JS too for client state)
        const token = document.cookie.split('; ').find(r => r.startsWith('coderly_token='))?.split('=')[1];
        const userId = document.cookie.split('; ').find(r => r.startsWith('coderly_uid='))?.split('=')[1];
        const username = document.cookie.split('; ').find(r => r.startsWith('coderly_uname='))?.split('=')[1];
        if (token && userId && username) {
            store.dispatch(setAuth({ token: decodeURIComponent(token), userId: decodeURIComponent(userId), username: decodeURIComponent(username) }));
        }
    }, []);
    return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <Provider store={store}>
            <AuthHydrator>{children}</AuthHydrator>
        </Provider>
    );
}
