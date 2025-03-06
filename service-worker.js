self.addEventListener('install', event => {
    event.waitUntil(
        caches.open('crypto-pulse-cache').then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/style.css',
                '/script.js',
                '/terms.html',
                '/privacy.html',
                'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap',
                'https://cdn.jsdelivr.net/npm/chart.js',
                'https://s3.tradingview.com/tv.js',
                'https://images.unsplash.com/photo-1631603090989-93f9ef6f9d80?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=50&w=50'
            ]);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request).then(networkResponse => {
                if (!networkResponse || !networkResponse.clone) {
                    console.warn('Invalid network response:', networkResponse);
                    return networkResponse || caches.match('/index.html');
                }

                const clonedResponse = networkResponse.clone();
                caches.open('crypto-pulse-cache').then(cache => {
                    cache.put(event.request, clonedResponse)
                        .catch(error => console.error('Cache put failed:', error));
                });

                return networkResponse;
            }).catch(error => {
                console.error('Fetch failed, falling back to cache:', error);
                return caches.match('/index.html');
            });
        }).catch(error => {
            console.error('Cache match failed:', error);
            return caches.match('/index.html');
        })
    );
});