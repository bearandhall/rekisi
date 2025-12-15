document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const contentArea = document.getElementById('content-area');
    const connectionLinesSvg = document.getElementById('connection-lines');
    const articlesListDiv = document.querySelector('.articles-list');
    const logoElement = document.getElementById('logo');
    
    // ---------------------------------------------
    // 1. 글 목록 동적 생성 (유지)
    // ---------------------------------------------
    const issue1Articles = Object.keys(articleData).filter(id => id !== 'intro_rekisi');
    
    const introSectionChildren = document.querySelector('#intro-section .menu-children');
    introSectionChildren.innerHTML = `<div class="node title-node article-link" data-node-id="소개글" data-article-id="intro_rekisi">레키시는 ...</div>`;

    issue1Articles.forEach(articleId => {
        const article = articleData[articleId];
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('article-item');
        itemDiv.dataset.articleId = articleId; // 아이템에도 ID 부여
        
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
    // 2. SVG 연결선 그리기 함수
    // ---------------------------------------------
    const drawConnections = () => {
        connectionLinesSvg.innerHTML = '';
        
        const connections = [
            { parent: 'logo', child: '소개' },
            { parent: 'logo', child: '1호' },
            { parent: '소개', child: '소개글' }
        ];

        const articlesContainer = document.querySelector('#issue-1-section .articles-list');
        const activeArticleId = contentArea.classList.contains('active') ? window.location.hash.substring(1) : null;

        if (!articlesContainer.classList.contains('collapsed')) {
             issue1Articles.forEach(articleId => {
                 const article = articleData[articleId];
                 
                 // 글이 선택된 상태이고 현재 글이 아니라면 선을 그리지 않음 (목록이 숨겨짐)
                 if (activeArticleId && activeArticleId !== articleId) {
                     return; 
                 }
                 
                 // 1호 -> 저자 연결
                 connections.push({ parent: '1호', child: article.author });
                 // 저자 -> 제목 연결
                 connections.push({ parent: article.author, child: article.title });
             });
        }
        
        const getNodeRect = (nodeId) => {
            const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
            if (!nodeElement) return null;

            const rect = nodeElement.getBoundingClientRect();
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

                const svgStartX = startX - window.scrollX;
                const svgStartY = startY - window.scrollY;
                const svgEndX = endX - window.scrollX;
                const svgEndY = endY - window.scrollY;

                // 베지어 곡선 생성
                if (conn.parent === 'logo') {
                    path.setAttribute('d', `M ${svgStartX} ${svgStartY} C ${svgStartX + 10} ${svgStartY}, ${svgEndX - 10} ${svgEndY}, ${svgEndX} ${svgEndY}`);
                } else if (conn.parent === '소개' || conn.parent === '1호') {
                    // 1단계 하위 노드: 1차 곡선
                    path.setAttribute('d', `M ${svgStartX} ${svgStartY} C ${svgStartX + 40} ${svgStartY}, ${svgEndX - 40} ${svgEndY}, ${svgEndX} ${svgEndY}`);
                } else {
                    // 2단계 하위 노드 (저자->제목): 늘어진 곡선
                    path.setAttribute('d', `M ${svgStartX} ${svgStartY} C ${svgStartX + distanceX * 0.1} ${svgStartY + distanceY * 0.9}, ${svgStartX + distanceX * 0.9} ${svgStartY + distanceY * 0.1}, ${svgEndX} ${svgEndY}`);
                }
                
                connectionLinesSvg.appendChild(path);
            }
        });
    };

    // ---------------------------------------------
    // 3. 화면 전환 및 목록 정리 함수 (★핵심 수정★)
    // ---------------------------------------------

    const toggleArticlesList = (target) => {
        // ... (토글 로직 유지) ...
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
        const allArticleItems = document.querySelectorAll('.articles-list .article-item');
        
        if (!article) {
            // 초기 화면 복귀: 글 내용 슬라이드 아웃
            contentArea.classList.remove('active'); 
            
            // 모든 글 항목 다시 표시
            allArticleItems.forEach(item => item.style.display = 'flex');

            document.querySelectorAll('.node').forEach(node => node.classList.remove('active'));
            if (window.location.hash) {
                window.history.pushState(null, null, '/');
            }
            // 선 다시 그리기
            setTimeout(drawConnections, 400); 
            return;
        }

        // 글 내용 채우기 (유지)
        document.getElementById('article-title').textContent = article.title;
        document.getElementById('article-meta').textContent = `${article.author} | ${article.date}`;
        document.getElementById('article-body').innerHTML = article.content.map(p => `<p>${p}</p>`).join('');

        // 글 내용 슬라이드 인
        contentArea.classList.add('active'); 
        
        // ★선택된 글 제외하고 목록 숨기기 (문제 5 해결)★
        allArticleItems.forEach(item => {
            if (item.dataset.articleId === articleId) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });

        // 노드 활성화 및 스크롤
        document.querySelectorAll('.node').forEach(node => node.classList.remove('active'));
        const activeNode = document.querySelector(`[data-article-id="${articleId}"]`);
        if (activeNode) {
            activeNode.classList.add('active');
        }

        contentArea.scrollTop = 0;
        
        // 해시 라우팅 및 선 다시 그리기
        if (window.location.hash !== `#${articleId}`) {
             window.history.pushState(null, null, `#${articleId}`);
        }
        setTimeout(drawConnections, 400); // 목록 변경 후 선 다시 그리기
    };

    // ---------------------------------------------
    // 4. 이벤트 리스너 및 초기화 (유지)
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

    logoElement.addEventListener('click', () => {
        showArticle(null); 
    });

    // ESC 키로 글 내용 닫기 (메뉴 복귀)
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && contentArea.classList.contains('active')) {
            showArticle(null);
        }
    });

    window.addEventListener('resize', drawConnections);
    sidebar.addEventListener('scroll', drawConnections);

    // 초기 로드 시: 해시 확인 후 표시
    const initialArticleId = window.location.hash.substring(1);
    if (initialArticleId) {
        showArticle(initialArticleId);
        if (articleData[initialArticleId] && initialArticleId !== 'intro_rekisi') {
             const articlesList = document.querySelector('#issue-1-section .articles-list');
             articlesList.style.maxHeight = articlesList.scrollHeight + "px";
             articlesList.classList.remove('collapsed');
             // showArticle에서 이미 목록 정리 및 선 그리기를 호출하므로 별도 호출 불필요
        }
    } else {
        // 초기에는 목록 전체 표시
        document.querySelectorAll('.articles-list .article-item').forEach(item => item.style.display = 'flex');
        showArticle(null); 
    }
    
    setTimeout(drawConnections, 10);
});
