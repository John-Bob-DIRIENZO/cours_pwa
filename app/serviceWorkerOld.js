const PREFIX = "V2";

const CACHED_FILES = [
    "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css"
];

self.addEventListener('install', (event) => {
    self.skipWaiting()
    event.waitUntil((async () => {
        const cache = await caches.open(PREFIX);

        // await cache.add(new Request('/offline.html'));

        await Promise.all([...CACHED_FILES, '/offline.html'].map(path => {
            return cache.add(new Request(path))
        }))

    })());
    console.log(`${PREFIX} - Je suis installé`)
});

self.addEventListener('activate', (event) => {
    self.clients.claim();
    event.waitUntil((async () => {
        // Je récupère les clés de cache
        const keys = caches.keys();

        // J'attends que tout ce traitement soit fait avant de passer
        // à la suite
        await Promise.all(
            (await keys).map(key => {
                if (!key.includes(PREFIX)) {
                    return caches.delete(key);
                }
            })
        );
    })());
    console.log(`${PREFIX} - Je suis activé`)
});


// Pour être un vrai SW, on doit écouter l'évènement 'fetch' qui est en gros
// toutes les requêtes faites par la page qu'on cherche à charger
self.addEventListener('fetch', (event) => {

    // on peut donc regarder tout ce qui se passe dans cet évènement
    console.log(event);

    // la partie event.request contient tout ce qui est passé au "fetch",
    // les requêtes en "cors" ou "no-cors" sont des ressources, les requêtes en
    // navigate sont la réelle navigation utilisateur
    console.log(`Fetching : ${event.request.url}`, `Mode : ${event.request.mode}`);


    // Du coup on peut intercepter le truc et dire que si je cherche à prendre une requête
    // de navigation
    if (event.request.mode === 'navigate') {

        // Je chope le truc en vol et peut choisir de changer la réponse de mon fetch
        // ATTENTION, je peux soit, envoyer un nouvel objet Response, soit passer une
        // promesse (pas un callback qui renvoie une promesse)
        // je vais donc utiliser la syntaxe
        // async () => {...}()
        // pour appeler directement mon callback et donc générer la promesse
        event.respondWith((async () => {
            // Donc j'essaye de regarder si il existe déjà une réponse pré-chargée
            try {
                const preloadResponse = await event.preloadResponse;
                if (preloadResponse) {
                    // Si c'est le cas je la renvoie
                    return preloadResponse;
                }
                // Sinon je fais le fetch comme si de rien n'était
                return await fetch(event.request);
            } catch (e) {
                // Si ça plante, c'est qu'on n'a pas de réseau, et dans ce cas je
                // renvoie une réponse déjà faite
                // return new Response('coucou');
                const cache = await caches.open(PREFIX);
                return await cache.match('/offline.html')
            }
        })())
    } else if (CACHED_FILES.includes(event.request.url)) {
        event.respondWith(caches.match(event.request))
    }

})
