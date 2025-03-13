document.addEventListener('DOMContentLoaded', async () => {
    const dashboard = document.getElementById('dashboard');
    const fullscreen = document.getElementById('fullscreen');
    const fullscreenTitle = document.getElementById('fullscreen-title');
    const fullscreenVideo = document.getElementById('fullscreen-video');
    const closeBtn = document.getElementById('close');

    try {
        // Charger les données des caméras
        const response = await fetch('cameras.json');
        const data = await response.json();

        // Vérifier si data.cameras est un objet ou un tableau
        if (Array.isArray(data.cameras)) {
            // Si c'est un tableau, créer une seule section
            const section = document.createElement('div');
            section.className = 'section';
            dashboard.appendChild(section);

            const sectionGrid = document.createElement('div');
            sectionGrid.className = 'grid-container';
            section.appendChild(sectionGrid);

            data.cameras.forEach(camera => createCameraElement(camera, sectionGrid));
        } else {
            // Si c'est un objet avec des sections
            Object.entries(data.cameras).forEach(([sectionName, cameras]) => {
                if (!Array.isArray(cameras)) {
                    console.error(`Les caméras de la section ${sectionName} ne sont pas dans un tableau`);
                    return;
                }

                const section = document.createElement('div');
                section.className = 'section';
                
                const sectionTitle = document.createElement('h2');
                sectionTitle.className = 'section-title';
                sectionTitle.textContent = sectionName;
                section.appendChild(sectionTitle);

                const sectionGrid = document.createElement('div');
                sectionGrid.className = 'grid-container';
                section.appendChild(sectionGrid);

                cameras.forEach(camera => createCameraElement(camera, sectionGrid));

                dashboard.appendChild(section);
            });
        }
    } catch (error) {
        console.error('Erreur lors du chargement des caméras:', error);
        dashboard.innerHTML = '<p class="error">Erreur lors du chargement des caméras</p>';
    }

    // Fonction pour créer un élément caméra
    function createCameraElement(camera, container) {
        const cameraContainer = document.createElement('div');
        cameraContainer.className = 'camera-container';

        // Gestion de la miniature
        if (camera.preview) {
            const preview = document.createElement('img');
            preview.src = camera.preview;
            preview.alt = camera.name;
            cameraContainer.appendChild(preview);
        } else {
            const isYoutube = camera.url.includes('youtube.com');
            
            if (isYoutube) {
                const iframe = document.createElement('iframe');
                iframe.src = camera.url;
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                iframe.allowFullscreen = true;
                cameraContainer.appendChild(iframe);
            } else {
                const video = document.createElement('video');
                video.src = camera.url;
                video.autoplay = true;
                video.muted = true;
                video.loop = true;
                video.playsInline = true;
                cameraContainer.appendChild(video);
            }
        }

        const title = document.createElement('div');
        title.className = 'camera-title';
        title.textContent = camera.name;
        cameraContainer.appendChild(title);

        // Gérer le clic pour le mode plein écran
        cameraContainer.addEventListener('click', () => {
            fullscreenTitle.textContent = camera.name;
            fullscreenVideo.innerHTML = '';

            const isYoutube = camera.url.includes('youtube.com');
            
            if (isYoutube) {
                const iframe = document.createElement('iframe');
                iframe.src = camera.url;
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                iframe.allowFullscreen = true;
                fullscreenVideo.appendChild(iframe);
            } else {
                const video = document.createElement('video');
                video.src = camera.url;
                video.autoplay = true;
                video.controls = true;
                video.playsInline = true;
                fullscreenVideo.appendChild(video);
            }

            fullscreen.classList.remove('hidden');
        });

        container.appendChild(cameraContainer);
    }

    // Gérer la fermeture du mode plein écran
    closeBtn.addEventListener('click', () => {
        fullscreen.classList.add('hidden');
        fullscreenVideo.innerHTML = '';
    });

    // Rafraîchir les images toutes les 5 minutes
    setInterval(() => {
        const images = document.querySelectorAll('.camera-container img');
        images.forEach(img => {
            if (img.src.includes('?')) {
                img.src = img.src.split('?')[0] + '?t=' + new Date().getTime();
            } else {
                img.src = img.src + '?t=' + new Date().getTime();
            }
        });
    }, 5 * 60 * 1000);
}); 