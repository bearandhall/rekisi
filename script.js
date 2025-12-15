document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const contentArea = document.getElementById('content-area');
    const articleDisplay = document.getElementById('article-display');
    const emptyState = document.getElementById('empty-state');
    const connectionLinesSvg = document.getElementById('connection-lines');
    const articlesListDiv = document.querySelector('.articles-list');
    const logoElement = document.getElementById('logo');
    
    // ---------------------------------------------
    // 1. 글 목록 동적 생성 및 노드 데이터 설정
    // ---------------------------------------------
    const issue1Articles = Object.keys(articleData).filter(id => id !== 'intro_rekisi');
    
    const introSectionChildren = document.querySelector('#intro-section .menu-children');
    introSectionChildren.innerHTML = `<div class="node title-node article-link" data-node-id="소개글" data-article-id="intro_rekisi">레키시는 ...</div>`;

    issue1Articles.forEach(articleId => {
        const article = articleData[articleId];
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('article-item');
        
        // 저자 노드 (1호 -> 저자 연결)
        const authorNode = document.createElement('div');
        authorNode.classList.add('node', 'author-node');
        authorNode.dataset.nodeId = article.author;
        authorNode.textContent = article.author;
        
        // 제목 노드 (저자 -> 제목 연결, 클릭 시 글 열림)
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
    // 2. SVG 연결선 그리기 함수 (★단순화 및 정확도 강화★)
    // ---------------------------------------------
    const drawConnections = () => {
        connectionLinesSvg.innerHTML = '';
        
        // 연결 관계 정의:
        const connections = [
            { parent: 'logo', child: '소개' },
            { parent: 'logo', child: '1호' },
            { parent: '소개', child: '소개글' }
        ];

        // 1호가 펼쳐져 있을 때만 세부 연결선을 추가
        const articlesContainer = document.querySelector('#issue-1-section .articles-list');
        if (!articlesContainer.classList.contains('collapsed')) {
             issue1Articles.forEach(articleId => {
                 const article = articleData[articleId];
                 connections.push({ parent: '1호', child: article.author });
                 connections.push({ parent: article.author, child: article.title });
             });
        }
        
        // 노드의 뷰포트 좌표를 가져오는 헬퍼 함수
        const getNodeRect = (nodeId) => {
            const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
            if (!nodeElement) return null;

            const rect = nodeElement.getBoundingClientRect();
            // 스크롤 위치를 고려하여 절대 뷰포트 좌표가 아닌, 문서 상의 좌표를 사용합니다.
            const x = rect.left + rect.width + window.scrollX; // 노드 오른쪽 끝 (X)
            const y = rect.top + rect.height / 2 + window.scrollY; // 노드 중앙 (Y)
            
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
                const endX = childPos.x - childNode.offsetWidth; 
                const endY = childPos.y;

                // 베지어 곡선 제어점 (느슨하게 축 늘어진 곡선 느낌)
                const distanceX = endX - startX;
                const distanceY = endY - startY;

                const controlX1 = startX + distanceX * 0.1;
                const controlY1 = startY + distanceY * 0.9; 
                const controlX2 = startX + distanceX * 0.9;
                const controlY2 = startY + distanceY * 0.1;
                
                // 선이 사이드바와 스크롤 동기화되도록 (뷰포트 좌표 -> SVG 캔버스 좌표)
                const svgStartX = startX - window.scrollX;
                const svgStartY = startY - window.scrollY;
                const svgEndX = endX - window.scrollX;
                const svgEndY = endY - window.scrollY;

                if (conn.parent === 'logo') {
                    path.setAttribute('d', `M ${svgStartX} ${svgStartY} L ${svgEndX} ${svgEndY}`);
                } else if (conn.parent === '소개' || conn.parent === '1호') {
                    path.setAttribute('d', `M ${svgStartX} ${svgStartY} C ${svgStartX + 50} ${svgStartY}, ${svgEndX - 50} ${svgEndY}, ${svgEndX} ${svgEndY}`);
                } else {
                    path.setAttribute('d', `M ${svgStartX} ${svgStartY} C ${svgStartX + distanceX * 0.1} ${svgStartY + distanceY * 0.9}, ${svgStartX + distanceX * 0.9} ${svgStartY + distanceY * 0.1}, ${svgEndX} ${svgEndY}`);
                }
                
                connectionLinesSvg.appendChild(path);
            }
        });
    };

    // ---------------------------------------------
    // 3. 토글 및 화면 전환 함수
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
    
    // 화면 전환 (문제 1 해결)
    const showArticle = (articleId) => {
        const article = articleData[articleId];
        
        if (!article) {
            // 초기 화면 또는 닫기 요청
            contentArea.classList.remove('active'); // 슬라이드하여 숨김
            document.querySelectorAll('.node').forEach(node => node.classList.remove('active'));
            if (window.location.hash) {
                window.history.pushState(null, null, '/');
            }
            return;
        }

        // 내용 표시
        document.getElementById('article-title').textContent = article.title;
        document.getElementById('article-meta').textContent = `${article.author} | ${article.date}`;
        document.getElementById('article-body').innerHTML = article.content.map(p => `<p>${p}</p>`).join('');

        contentArea.classList.add('active'); // 슬라이드하여 보이기
        
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

    // 로고 클릭 시 초기 화면으로 복귀 (contentArea 숨김)
    logoElement.addEventListener('click', () => {
        showArticle(null); 
    });

    // 내용 영역 외부를 클릭하면 닫기
    contentArea.addEventListener('click', (event) => {
        // 내용 영역의 특정 요소가 아닌, 배경 자체를 클릭했을 경우 닫기
        if (event.target === contentArea) {
            showArticle(null);
        }
    });

    window.addEventListener('resize', drawConnections);
    sidebar.addEventListener('scroll', drawConnections);

    // 초기 로드 시: 해시가 없으면 아무것도 표시하지 않음 (문제 2 해결)
    const initialArticleId = window.location.hash.substring(1);
    if (initialArticleId) {
        showArticle(initialArticleId);
    } else {
        showArticle(null); // 빈 화면 표시
    }
    
    setTimeout(drawConnections, 10);
});
