document.addEventListener('DOMContentLoaded', async () => {
    const dashboard = document.getElementById('dashboard');
    const fullscreen = document.getElementById('fullscreen');
    const fullscreenTitle = document.getElementById('fullscreen-title');
    const fullscreenVideo = document.getElementById('fullscreen-video');
    const closeBtn = document.getElementById('close');

    // Fonction pour convertir une URL YouTube en URL d'intégration
    function getYouTubeEmbedUrl(url) {
        let videoId;
        
        // Format: https://www.youtube.com/watch?v=VIDEO_ID
        const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
        if (watchMatch) {
            videoId = watchMatch[1];
        }
        
        // Format: https://www.youtube.com/embed/VIDEO_ID
        const embedMatch = url.match(/youtube\.com\/embed\/([^&\s]+)/);
        if (embedMatch) {
            videoId = embedMatch[1];
        }

        // Format: https://www.youtube.com/live/VIDEO_ID
        const liveMatch = url.match(/youtube\.com\/live\/([^&\s]+)/);
        if (liveMatch) {
            videoId = liveMatch[1];
        }

        // Format pour les chaînes en direct
        const channelMatch = url.match(/channel=([^&\s]+)/);
        if (channelMatch) {
            return `https://www.youtube.com/embed/live_stream?channel=${channelMatch[1]}&autoplay=1&mute=1&enablejsapi=1&controls=1&rel=0`;
        }

        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&enablejsapi=1&controls=1&rel=0`;
        }

        return url;
    }

    // Fonction pour gérer les URLs Viewsurf
    function getViewsurfUrls(url) {
        // Extraire l'ID de la caméra et le paramètre i depuis l'URL Viewsurf
        const viewsurfMatch = url.match(/viewsurf\.com\/(\d+)/);
        const iParamMatch = url.match(/[?&]i=([^&]+)/);
        
        if (!viewsurfMatch) return null;

        const cameraId = viewsurfMatch[1];
        const iParam = iParamMatch ? iParamMatch[1] : '';
        
        return {
            // URL de la preview (image statique mise à jour régulièrement)
            preview: `https://pv.viewsurf.com/${cameraId}/preview.jpg${iParam ? '?i=' + iParam : ''}`,
            // URL de l'iframe pour le direct
            embed: `https://pv.viewsurf.com/${cameraId}/${iParam ? '?i=' + iParam : ''}`
        };
    }

    // Fonction pour gérer les URLs Vision Environnement
    function getVisionEnvironnementUrls(url) {
        // Extraire l'ID de la caméra depuis l'URL Vision Environnement
        const visionMatch = url.match(/player\/([^.]+)\.php/);
        if (!visionMatch) return null;

        const cameraId = visionMatch[1];
        return {
            // URL de la preview (image statique mise à jour régulièrement)
            preview: `https://www.vision-environnement.com/live/miniature/${cameraId}.jpg`,
            // URL de l'iframe pour le direct
            embed: `https://www.vision-environnement.com/live/player/${cameraId}.php`
        };
    }

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

        const isYoutube = camera.url.includes('youtube.com');
        const isViewsurf = camera.url.includes('viewsurf.com');
        const isVisionEnv = camera.url.includes('vision-environnement.com');
        
        // Gestion de la miniature
        if (camera.preview) {
            const preview = document.createElement('img');
            preview.src = camera.preview;
            preview.alt = camera.name;
            cameraContainer.appendChild(preview);
        } else if (isViewsurf) {
            const viewsurfUrls = getViewsurfUrls(camera.url);
            if (viewsurfUrls) {
                const preview = document.createElement('img');
                preview.src = viewsurfUrls.preview;
                preview.alt = camera.name;
                cameraContainer.appendChild(preview);
            }
        } else if (isVisionEnv) {
            const visionUrls = getVisionEnvironnementUrls(camera.url);
            if (visionUrls) {
                const preview = document.createElement('img');
                preview.src = visionUrls.preview;
                preview.alt = camera.name;
                cameraContainer.appendChild(preview);
            }
        } else if (!isYoutube) {
            const video = document.createElement('video');
            video.src = camera.url;
            video.autoplay = true;
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            cameraContainer.appendChild(video);
        } else {
            const iframe = document.createElement('iframe');
            iframe.src = getYouTubeEmbedUrl(camera.url);
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;
            cameraContainer.appendChild(iframe);
        }

        const title = document.createElement('div');
        title.className = 'camera-title';
        title.textContent = camera.name;
        cameraContainer.appendChild(title);

        // Gérer le clic pour le mode plein écran
        cameraContainer.addEventListener('click', () => {
            fullscreenTitle.textContent = camera.name;
            fullscreenVideo.innerHTML = '';

            if (isViewsurf) {
                const viewsurfUrls = getViewsurfUrls(camera.url);
                if (viewsurfUrls) {
                    const iframe = document.createElement('iframe');
                    iframe.src = viewsurfUrls.embed;
                    iframe.allowFullscreen = true;
                    fullscreenVideo.appendChild(iframe);
                }
            } else if (isVisionEnv) {
                const visionUrls = getVisionEnvironnementUrls(camera.url);
                if (visionUrls) {
                    const iframe = document.createElement('iframe');
                    iframe.src = visionUrls.embed;
                    iframe.allowFullscreen = true;
                    iframe.allow = 'autoplay; fullscreen';
                    fullscreenVideo.appendChild(iframe);
                }
            } else if (isYoutube) {
                const iframe = document.createElement('iframe');
                iframe.src = getYouTubeEmbedUrl(camera.url);
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
            if (img.src.includes('viewsurf.com') || img.src.includes('vision-environnement.com') || img.src.includes('?')) {
                const currentTime = new Date().getTime();
                if (img.src.includes('viewsurf.com') || img.src.includes('vision-environnement.com')) {
                    img.src = img.src.split('?')[0] + '?t=' + currentTime;
                } else {
                    img.src = img.src.split('?')[0] + '?t=' + currentTime;
                }
            }
        });
    }, 5 * 60 * 1000);
}); 