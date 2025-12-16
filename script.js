document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const connectionLinesSvg = document.getElementById('connection-lines');
    const articlesListDiv = document.querySelector('.articles-list');
    const logoElement = document.getElementById('logo'); 
    
    // 모달 관련 요소 (생략된 부분)
    const modal = document.getElementById('article-modal');
    const closeBtn = document.querySelector('.close-btn');
    const modalTitle = document.getElementById('modal-article-title');
    const modalMeta = document.getElementById('modal-article-meta');
    const modalBody = document.getElementById('modal-article-body');
    
    // (1. 글 목록 동적 생성 - 유지)
    const articleData = window.articleData || {}; // articles.js 파일의 데이터를 사용한다고 가정
    const issue1Articles = Object.keys(articleData).filter(id => id !== 'intro_rekisi');
    
    const introSectionChildren = document.querySelector('#intro-section .menu-children');
    introSectionChildren.innerHTML = `<div class="node title-node article-link" data-node-id="소개글" data-article-id="intro_rekisi">레키시는 ...</div>`;

    issue1Articles.forEach(articleId => {
        const article = articleData[articleId];
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('article-item');
        itemDiv.dataset.articleId = articleId; 
        
        const authorNode = document.createElement('div');
        authorNode.classList.add('node', 'author-node');
        authorNode.dataset.nodeId = article.author;
        authorNode.textContent = article.author;
        
        const titleNode = document.createElement('div');
        titleNode.classList.add('node', 'title-node', 'article-link');
        titleNode.dataset.nodeId = article.title; 
        titleNode.dataset.articleId = articleId; 
        titleNode.textContent = article.title;
        
        itemDiv.appendChild(authorNode);
        itemDiv.appendChild(titleNode);
        articlesListDiv.appendChild(itemDiv);
    });

    // ---------------------------------------------
    // 2. SVG 연결선 그리기 함수 (★선 연결 안정화★)
    // ---------------------------------------------
    const drawConnections = () => {
        connectionLinesSvg.innerHTML = '';
        
        const connections = [
            { parent: 'logo', child: '소개', type: 'logo' },
            { parent: 'logo', child: '1호', type: 'logo' },
        ];

        const introChildren = document.querySelector('#intro-section .menu-children');
        if (introChildren.classList.contains('expanded')) {
            connections.push({ parent: '소개', child: '소개글', type: 'parent' });
        }

        const articlesContainer = document.querySelector('#issue-1-section .menu-children');
        
        if (articlesContainer.classList.contains('expanded')) {
             issue1Articles.forEach(articleId => {
                 const article = articleData[articleId];
                 connections.push({ parent: '1호', child: article.author, type: 'parent' });
                 connections.push({ parent: article.author, child: article.title, type: 'straight' });
             });
        }
        
        // ★스크롤 위치와 노드 좌표를 정확히 계산하는 함수★
        const getNodeRect = (nodeId) => {
            const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
            if (!nodeElement) return null;

            const rect = nodeElement.getBoundingClientRect();
            
            let startX, startY;
            
            if (nodeId === 'logo') { 
                // 로고 중앙 하단
                startX = rect.left + rect.width / 2; 
                startY = rect.bottom; 
            } else {
                // 일반 노드 오른쪽 중앙
                startX = rect.left + rect.width;
                startY = rect.top + rect.height / 2;
            }
            
            // 뷰포트 기준 좌표와 sidebar 스크롤 값을 반환
            return { 
                x: startX, 
                y: startY, 
                width: rect.width,
                height: rect.height,
                scrollTop: sidebar.scrollTop 
            }; 
        };

        connections.forEach(conn => {
            const parentPos = getNodeRect(conn.parent);
            const childNode = document.querySelector(`[data-node-id="${conn.child}"]`);
            const childPos = getNodeRect(conn.child);
            
            if (parentPos && childPos && childNode) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

                // 뷰포트 기준 Y 좌표에 현재 스크롤 값을 더하여 SVG의 Y 좌표를 결정 (스크롤 보정)
                const finalSvgStartY = parentPos.y + parentPos.scrollTop; 
                const finalSvgEndY = childPos.y + childPos.scrollTop;
                
                // X 좌표는 뷰포트 기준으로 사용
                const svgStartX = parentPos.x;
                const svgEndX = childPos.x - childNode.offsetWidth;
                
                const distanceX = svgEndX - svgStartX;
                const distanceY = finalSvgEndY - finalSvgStartY;
                
                let dPath;

                if (conn.type === 'logo') {
                    // 로고에서 뻗어나가는 선
                    dPath = `M ${svgStartX} ${finalSvgStartY} C ${svgStartX + 10} ${finalSvgStartY + 10}, ${svgEndX - 10} ${finalSvgEndY}, ${svgEndX} ${finalSvgEndY}`;
                } else if (conn.type === 'straight') {
                     // 저자 -> 제목 연결: L-자형
                    const midX = svgStartX + distanceX * 0.5;
                    dPath = `M ${svgStartX} ${finalSvgStartY} L ${midX} ${finalSvgStartY} L ${midX} ${finalSvgEndY} L ${svgEndX} ${finalSvgEndY}`;
                } else {
                    // 1단계 하위 노드 (소개 -> 소개글, 1호 -> 저자)
                    dPath = `M ${svgStartX} ${finalSvgStartY} C ${svgStartX + 40} ${finalSvgStartY}, ${svgEndX - 40} ${finalSvgEndY}, ${svgEndX} ${finalSvgEndY}`;
                }
                
                path.setAttribute('d', dPath);
                connectionLinesSvg.appendChild(path);
            }
        });
    };
    
    // (3. 모달 표시/닫기 함수 - 유지)
    const showArticleModal = (articleId) => {
        const article = articleData[articleId];
        if (!article) { closeModal(); return; }
        
        // 내용 채우기 (생략)
        modalTitle.textContent = article.title;
        modalMeta.textContent = `${article.author} | ${article.date}`;
        modalBody.innerHTML = article.content.map(p => `<p>${p}</p>`).join('');

        document.querySelectorAll('.node').forEach(node => node.classList.remove('active'));
        const activeNode = document.querySelector(`[data-article-id="${articleId}"]`);
        if (activeNode) { activeNode.classList.add('active'); }
        
        modal.style.display = 'block';
        modal.scrollTop = 0;
    };
    
    const closeModal = () => {
        modal.style.display = 'none';
        document.querySelectorAll('.node').forEach(node => node.classList.remove('active'));
    };
    
    const toggleArticlesList = (target) => {
        const list = target.closest('.menu-section').querySelector('.menu-children');
        const isExpanded = list.classList.contains('expanded');
        
        if (isExpanded) {
            list.classList.remove('expanded');
        } else {
            list.classList.add('expanded');
        }

        setTimeout(drawConnections, 300);
    };


    // ---------------------------------------------
    // 4. 이벤트 리스너 및 초기화 (★토글러 이벤트 확인★)
    // ---------------------------------------------
    sidebar.addEventListener('click', (event) => {
        const node = event.target.closest('.node');
        
        if (node) {
            if (node.id === 'logo') {
                closeModal(); 
                document.querySelectorAll('.menu-children').forEach(list => list.classList.remove('expanded'));
                setTimeout(drawConnections, 400);
            } else if (node.classList.contains('article-link')) {
                // 글 제목 클릭 (하위 노드 및 소개 노드)
                showArticleModal(node.dataset.articleId);
            } else if (node.classList.contains('toggler')) {
                // ★'소개' 또는 '1호' 클릭 (문제 해결)★
                closeModal();
                toggleArticlesList(node);
            }
        }
    });

    // 로고 이벤트 (여전히 필요)
    logoElement.addEventListener('click', () => {
        closeModal(); 
        document.querySelectorAll('.menu-children').forEach(list => list.classList.remove('expanded'));
        setTimeout(drawConnections, 400);
    });

    // 모달 닫기 이벤트 등 (유지)
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) { closeModal(); }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') { closeModal(); }
    });

    window.addEventListener('resize', drawConnections);
    sidebar.addEventListener('scroll', drawConnections);

    // 초기 로드 시: 하위 메뉴 숨기기 및 선 그리기
    document.querySelectorAll('.menu-children').forEach(list => {
        list.classList.remove('expanded');
    });
    
    setTimeout(drawConnections, 10);
});
