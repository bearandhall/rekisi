document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const contentArea = document.getElementById('content-area');
    const articleDisplay = document.getElementById('article-display');
    const emptyState = document.getElementById('empty-state');
    const connectionLinesSvg = document.getElementById('connection-lines');
    const articlesListDiv = document.querySelector('.articles-list');
    const logoElement = document.getElementById('logo');

    // articles.js 에서 불러온 articleData를 사용합니다.

    // ---------------------------------------------
    // 1. 글 목록 동적 생성 및 노드 데이터 설정
    // ---------------------------------------------
    const issue1Articles = Object.keys(articleData).filter(id => id !== 'intro_rekisi');
    issue1Articles.forEach(articleId => {
        const article = articleData[articleId];
        const nodeDiv = document.createElement('div');
        nodeDiv.classList.add('node', 'child', 'article-link'); // article-link 클래스 추가
        nodeDiv.dataset.nodeId = article.author + '-' + article.title; // 고유 ID로 설정
        nodeDiv.dataset.articleId = articleId; 
        nodeDiv.textContent = `${article.author} - ${article.title}`;
        articlesListDiv.appendChild(nodeDiv);
    });

    // ---------------------------------------------
    // 2. SVG 연결선 그리기 함수 (업데이트)
    // ---------------------------------------------
    const drawConnections = () => {
        connectionLinesSvg.innerHTML = '';

        // 연결 관계 정의: 부모 노드의 data-node-id와 자식 노드의 data-node-id를 연결
        const connections = [
            { parent: 'logo', child: '소개' },
            { parent: 'logo', child: '1호' },
            { parent: '소개', child: '소개글' },
        ];
        
        // 1호와 모든 자식 글 연결 (1호가 펼쳐져 있을 때만 그리기)
        const articlesContainer = document.querySelector('#issue-1-section .articles-list');
        if (!articlesContainer.classList.contains('collapsed')) {
             issue1Articles.forEach(articleId => {
                 const articleTitle = articleData[articleId].author + '-' + articleData[articleId].title;
                 connections.push({ parent: '1호', child: articleTitle });
             });
        }

        const getNodeRect = (nodeId) => {
            const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
            if (nodeElement) {
                const rect = nodeElement.getBoundingClientRect();
                return {
                    x: rect.left + rect.width / 2, 
                    y: rect.top + rect.height / 2  
                };
            }
            return null;
        };

        connections.forEach(conn => {
            const parentPos = getNodeRect(conn.parent);
            const childPos = getNodeRect(conn.child);

            if (parentPos && childPos) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const startX = parentPos.x;
                const startY = parentPos.y;
                const endX = childPos.x;
                const endY = childPos.y;

                // 느슨하게 축 늘어진 곡선 (베지어 곡선)
                const controlX1 = startX + (endX - startX) * 0.2;
                const controlY1 = startY + (endY - startY) * 0.8; 
                const controlX2 = startX + (endX - startX) * 0.8;
                const controlY2 = startY + (endY - startY) * 0.2;

                // 로고와 소개/1호 연결은 비교적 직선에 가깝게
                if (conn.parent === 'logo') {
                    path.setAttribute('d', `M ${startX} ${startY} L ${endX} ${endY}`);
                } else if (window.innerWidth <= 768) {
                    // 모바일: 수직 방향으로 늘어진 곡선
                    const midY = startY + (endY - startY) * 0.5;
                    path.setAttribute('d', `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`);
                } else {
                    // 데스크탑: 부드럽게 늘어진 곡선
                     path.setAttribute('d', `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`);
                }
                
                connectionLinesSvg.appendChild(path);
            }
        });
    };

    // ---------------------------------------------
    // 3. 토글 및 라우팅 함수
    // ---------------------------------------------

    // 글 목록 토글 함수 (2번 문제 해결)
    const toggleArticlesList = (target) => {
        const list = target.closest('.menu-section').querySelector('.articles-list');
        if (list) {
            list.classList.toggle('collapsed');
            // 토글 후 선 다시 그리기
            setTimeout(drawConnections, 300); // CSS transition 시간 후 실행
        }
    };
    
    const showArticle = (articleId) => {
        const article = articleData[articleId];
        // ... (이전 showArticle 로직과 동일) ...
        if (!article) {
            emptyState.style.display = 'block';
            articleDisplay.style.display = 'none';
            document.querySelectorAll('.node').forEach(node => node.classList.remove('active'));
            return;
        }

        // 내용 표시
        document.getElementById('article-title').textContent = article.title;
        document.getElementById('article-meta').textContent = `${article.author} | ${article.date}`;
        document.getElementById('article-body').innerHTML = article.content.map(p => `<p>${p}</p>`).join('');

        emptyState.style.display = 'none';
        articleDisplay.style.display = 'block';

        // 노드 활성화
        document.querySelectorAll('.node').forEach(node => node.classList.remove('active'));
        const activeNode = document.querySelector(`[data-article-id="${articleId}"]`);
        if (activeNode) {
            activeNode.classList.add('active');
        }

        contentArea.scrollTop = 0;
        
        // ★ 해시 라우팅: 주소창 업데이트 ★
        if (window.location.hash !== `#${articleId}`) {
             window.history.pushState(null, null, `#${articleId}`);
        }
    };

    // ---------------------------------------------
    // 4. 이벤트 리스너 및 초기화
    // ---------------------------------------------
    // 메뉴 클릭 이벤트
    sidebar.addEventListener('click', (event) => {
        const node = event.target.closest('.node');
        if (node) {
            if (node.classList.contains('article-link')) {
                // 글 클릭 시
                showArticle(node.dataset.articleId);
            } else if (node.classList.contains('toggler')) {
                // '1호' (토글러) 클릭 시
                toggleArticlesList(node);
            }
        }
    });

    // 로고 클릭 이벤트 (3번 문제 해결)
    logoElement.addEventListener('click', () => {
        window.history.pushState(null, null, '/'); // 해시 제거
        showArticle('intro_rekisi');
    });


    // 주소창 해시 변경 감지
    window.addEventListener('hashchange', () => {
        const articleIdFromHash = window.location.hash.substring(1); 
        if (articleIdFromHash) {
            // 주소 해시를 통해 해당 글을 찾아 표시
            showArticle(articleIdFromHash);
            
            // 만약 글이 1호 안에 있다면, 1호 목록을 펼쳐주기 (사용자 편의)
            if (articleIdFromHash !== 'intro_rekisi') {
                 document.querySelector('#issue-1-section .articles-list').classList.remove('collapsed');
                 setTimeout(drawConnections, 100);
            }

        } else {
            // 해시가 없는 경우 기본 페이지 (소개글) 표시
            showArticle('intro_rekisi'); 
        }
    });

    window.addEventListener('resize', drawConnections);

    // 초기 로드 시 실행
    drawConnections();
    
    // 페이지 로드 시 주소창의 해시를 확인하여 해당 글 표시
    const initialArticleId = window.location.hash.substring(1) || 'intro_rekisi';
    showArticle(initialArticleId);
});
