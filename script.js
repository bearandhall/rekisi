document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const contentArea = document.getElementById('content-area');
    const connectionLinesSvg = document.getElementById('connection-lines');
    const articlesListDiv = document.querySelector('.articles-list');
    const logoElement = document.getElementById('logo');
    
    // ---------------------------------------------
    // 1. 글 목록 동적 생성 (이전과 동일하게 유지)
    // ---------------------------------------------
    const issue1Articles = Object.keys(articleData).filter(id => id !== 'intro_rekisi');
    
    const introSectionChildren = document.querySelector('#intro-section .menu-children');
    introSectionChildren.innerHTML = `<div class="node title-node article-link" data-node-id="소개글" data-article-id="intro_rekisi">레키시는 ...</div>`;

    issue1Articles.forEach(articleId => {
        const article = articleData[articleId];
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('article-item');
        
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
    // 2. SVG 연결선 그리기 함수 (이전 로직 유지)
    // ---------------------------------------------
    const drawConnections = () => {
        connectionLinesSvg.innerHTML = '';
        
        const connections = [
            { parent: 'logo', child: '소개' },
            { parent: 'logo', child: '1호' },
            { parent: '소개', child: '소개글' }
        ];

        const articlesContainer = document.querySelector('#issue-1-section .articles-list');
        if (!articlesContainer.classList.contains('collapsed')) {
             issue1Articles.forEach(articleId => {
                 const article = articleData[articleId];
                 connections.push({ parent: '1호', child: article.author });
                 connections.push({ parent: article.author, child: article.title });
             });
        }
        
        const getNodeRect = (nodeId) => {
            const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
            if (!nodeElement) return null;

            const rect = nodeElement.getBoundingClientRect();
            // 뷰포트 기준 좌표를 그대로 사용합니다.
            const x = rect.left + rect.width + window.scrollX;
            const y = rect.top + rect.height / 2 + window.scrollY;
            
            return { x, y };
        };

        connections.forEach(conn => {
            const parentPos = getNodeRect(conn.parent);
            const childNode = document.querySelector(`[data-node-id="${conn.child}"]`);
            const childPos = getNodeRect(conn.child);
            
            if (parentPos && childPos) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const startX = parentPos.x;
                const startY = parentPos.y;
                const endX = childPos.x - (childNode ? childNode.offsetWidth : 0); 
                const endY = childPos.y;

                const distanceX = endX - startX;
                const distanceY = endY - startY;

                // SVG 캔버스 좌표로 변환
                const svgStartX = startX - window.scrollX;
                const svgStartY = startY - window.scrollY;
                const svgEndX = endX - window.scrollX;
                const svgEndY = endY - window.scrollY;

                // 베지어 곡선 생성
                if (conn.parent === 'logo') {
                    path.setAttribute('d', `M ${svgStartX} ${svgStartY} L ${svgEndX} ${svgEndY}`);
                } else if (conn.parent === '소개' || conn.parent === '1호') {
                    path.setAttribute('d', `M ${svgStartX} ${svgStartY} C ${svgStartX + 50} ${svgStartY}, ${svgEndX - 50} ${svgEndY}, ${svgEndX} ${svgEndY}`);
                } else {
                    // 느슨하게 늘어진 곡선
                    path.setAttribute('d', `M ${svgStartX} ${svgStartY} C ${svgStartX + distanceX * 0.1} ${svgStartY + distanceY * 0.9}, ${svgStartX + distanceX * 0.9} ${svgStartY + distanceY * 0.1}, ${svgEndX} ${svgEndY}`);
                }
                
                connectionLinesSvg.appendChild(path);
            }
        });
    };

    // ---------------------------------------------
    // 3. 토글 및 화면 전환 함수 (★가장 크게 수정됨★)
    // ---------------------------------------------

    const toggleArticlesList = (target) => {
        const list = target.closest('.menu-section').querySelector('.articles-list');
        if (list) {
            const isCollapsed = list.classList.contains('collapsed');
            
            if (isCollapsed) {
                list.style.maxHeight = list.scrollHeight + "px";
                list.classList.remove('collapsed');
            } else {
                list.style.maxHeight = list.scrollHeight + "px";
                setTimeout(() => {
                    list.style.maxHeight = "0"; 
                    list.classList.add('collapsed');
                }, 10);
            }

            setTimeout(drawConnections, 300);
        }
    };
    
    // 화면 전환 및 라우팅
    const showArticle = (articleId) => {
        const article = articleData[articleId];
        const articleTitle = document.getElementById('article-title');
        const articleMeta = document.getElementById('article-meta');
        const articleBody = document.getElementById('article-body');
        const emptyState = document.getElementById('empty-state');
        
        if (!article) {
            // 초기 화면 복귀 (오버레이 숨기기)
            contentArea.classList.remove('active'); 
            emptyState.style.display = 'block';
            
            document.querySelectorAll('.node').forEach(node => node.classList.remove('active'));
            if (window.location.hash) {
                window.history.pushState(null, null, '/');
            }
            return;
        }

        // 내용 채우기
        articleTitle.textContent = article.title;
        articleMeta.textContent = `${article.author} | ${article.date}`;
        articleBody.innerHTML = article.content.map(p => `<p>${p}</p>`).join('');

        contentArea.classList.add('active'); // 오버레이 표시
        emptyState.style.display = 'none';
        
        // 노드 활성화
        document.querySelectorAll('.node').forEach(node => node.classList.remove('active'));
        const activeNode = document.querySelector(`[data-article-id="${articleId}"]`);
        if (activeNode) {
            activeNode.classList.add('active');
        }

        contentArea.scrollTop = 0;
        
        // 해시 라우팅: 주소창 업데이트 
        if (window.location.hash !== `#${articleId}`) {
             window.history.pushState(null, null, `#${articleId}`);
        }
    };

    // ---------------------------------------------
    // 4. 이벤트 리스너 및 초기화
    // ---------------------------------------------
    sidebar.addEventListener('click', (event) => {
        const node = event.target.closest('.node');
        if (node) {
            if (node.classList.contains('article-link')) {
                showArticle(node.dataset.articleId);
            } else if (node.classList.contains('toggler')) {
                toggleArticlesList(node);
            }
        }
    });

    // 로고 클릭 시 초기 화면으로 복귀
    logoElement.addEventListener('click', () => {
        showArticle(null); 
    });

    // 내용 영역 (오버레이) 내에서 '닫기' 기능 추가: ESC 키
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && contentArea.classList.contains('active')) {
            showArticle(null);
        }
    });

    window.addEventListener('resize', drawConnections);
    sidebar.addEventListener('scroll', drawConnections);

    // 초기 로드 시: 해시 확인 후 표시, 없으면 빈 화면
    const initialArticleId = window.location.hash.substring(1);
    if (initialArticleId) {
        showArticle(initialArticleId);
        // 만약 1호 글이라면, 자동으로 목록 펼치기
        if (articleData[initialArticleId] && initialArticleId !== 'intro_rekisi') {
             const articlesList = document.querySelector('#issue-1-section .articles-list');
             articlesList.style.maxHeight = articlesList.scrollHeight + "px";
             articlesList.classList.remove('collapsed');
             setTimeout(drawConnections, 300);
        }
    } else {
        showArticle(null); 
    }
    
    setTimeout(drawConnections, 10);
});
