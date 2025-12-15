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
    // 2. SVG 연결선 그리기 함수 (★좌표 조정 및 저자-제목 연결 추가★)
    // ---------------------------------------------
    const drawConnections = () => {
        connectionLinesSvg.innerHTML = '';
        
        const connections = [
            // REKISI 로고는 왼쪽 끝에 위치
            { parent: 'logo', child: '소개', startAdjust: -150 }, // 로고 시작점 왼쪽으로 조정
            { parent: 'logo', child: '1호', startAdjust: -150 }, 
            
            // 소개 -> 소개글
            { parent: '소개', child: '소개글' }
        ];

        const articlesContainer = document.querySelector('#issue-1-section .articles-list');
        if (!articlesContainer.classList.contains('collapsed')) {
             issue1Articles.forEach(articleId => {
                 const article = articleData[articleId];
                 // 1호 -> 저자 연결
                 connections.push({ parent: '1호', child: article.author });
                 // ★저자 -> 제목 연결 (문제 3 해결)
                 connections.push({ parent: article.author, child: article.title });
             });
        }
        
        const getNodeRect = (nodeId) => {
            const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
            if (!nodeElement) return null;

            const rect = nodeElement.getBoundingClientRect();
            // 노드의 오른쪽 끝 (선이 시작하는 지점)
            const x = rect.left + rect.width + window.scrollX;
            // 노드의 중앙 y
            const y = rect.top + rect.height / 2 + window.scrollY;
            
            return { x, y };
        };

        connections.forEach(conn => {
            const parentPos = getNodeRect(conn.parent);
            const childNode = document.querySelector(`[data-node-id="${conn.child}"]`);
            const childPos = getNodeRect(conn.child);
            
            if (parentPos && childPos) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                // 시작점: (선 조정이 필요한 경우 적용)
                const startX = parentPos.x + (conn.startAdjust || 0); 
                const startY = parentPos.y;
                // 끝점: 자식 노드의 왼쪽 끝
                const endX = childPos.x - (childNode ? childNode.offsetWidth : 0); 
                const endY = childPos.y;

                const distanceX = endX - startX;
                const distanceY = endY - startY;

                // SVG 캔버스 좌표로 변환 (스크롤 보정)
                const svgStartX = startX - window.scrollX;
                const svgStartY = startY - window.scrollY;
                const svgEndX = endX - window.scrollX;
                const svgEndY = endY - window.scrollY;

                // 베지어 곡선 생성
                if (conn.parent === 'logo') {
                    // 로고는 REKISI 글자 왼쪽에서 선이 시작되도록 강제 조정
                    path.setAttribute('d', `M ${svgStartX} ${svgStartY} L ${svgEndX} ${svgEndY}`);
                } else if (conn.parent === '소개' || conn.parent === '1호' || conn.parent === articleData[conn.parent]?.author) {
                    // 1단계 하위 노드 (저자 포함): 1차 곡선
                    path.setAttribute('d', `M ${svgStartX} ${svgStartY} C ${svgStartX + 50} ${svgStartY}, ${svgEndX - 50} ${svgEndY}, ${svgEndX} ${svgEndY}`);
                } else {
                    // 2단계 하위 노드 (글 제목): 늘어진 곡선
                    path.setAttribute('d', `M ${svgStartX} ${svgStartY} C ${svgStartX + distanceX * 0.1} ${svgStartY + distanceY * 0.9}, ${svgStartX + distanceX * 0.9} ${svgStartY + distanceY * 0.1}, ${svgEndX} ${svgEndY}`);
                }
                
                connectionLinesSvg.appendChild(path);
            }
        });
    };

    // ---------------------------------------------
    // 3. 화면 전환 함수 (★글 내용 우측 슬라이드 인/아웃★)
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
        
        if (!article) {
            // 글 내용 슬라이드 아웃 (오른쪽으로 숨김)
            contentArea.classList.remove('active'); 
            
            document.querySelectorAll('.node').forEach(node => node.classList.remove('active'));
            if (window.location.hash) {
                window.history.pushState(null, null, '/');
            }
            return;
        }

        // 내용 채우기
        document.getElementById('article-title').textContent = article.title;
        document.getElementById('article-meta').textContent = `${article.author} | ${article.date}`;
        document.getElementById('article-body').innerHTML = article.content.map(p => `<p>${p}</p>`).join('');

        contentArea.classList.add('active'); // 글 내용 슬라이드 인
        
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

    // 로고 클릭 시 초기 화면으로 복귀 (글 내용 슬라이드 아웃)
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

    // 초기 로드 시: 해시 확인 후 표시, 없으면 글 내용 슬라이드 아웃 (메뉴 복귀)
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
