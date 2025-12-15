document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const contentArea = document.getElementById('content-area');
    const articleDisplay = document.getElementById('article-display');
    const articleTitle = document.getElementById('article-title');
    const articleMeta = document.getElementById('article-meta');
    const articleBody = document.getElementById('article-body');
    const emptyState = document.getElementById('empty-state');
    const connectionLinesSvg = document.getElementById('connection-lines');
    const articlesListDiv = document.querySelector('.articles-list');

    // articles.js 에서 불러온 articleData를 사용합니다. (전역 변수로 가정)
    // articleData 구조: { id: { title, author, date, content } }

    // ---------------------------------------------
    // 1. 글 목록 동적 생성
    // ---------------------------------------------
    const issue1Articles = Object.keys(articleData).filter(id => id !== 'intro_rekisi'); // 소개글 제외
    issue1Articles.forEach(articleId => {
        const article = articleData[articleId];
        const nodeDiv = document.createElement('div');
        nodeDiv.classList.add('node', 'child');
        nodeDiv.dataset.nodeId = article.title; // 선 연결을 위한 ID
        nodeDiv.dataset.articleId = articleId; // 실제 글 데이터를 불러올 ID
        nodeDiv.textContent = article.title;
        articlesListDiv.appendChild(nodeDiv);
    });

    // ---------------------------------------------
    // 2. SVG 연결선 그리기 함수
    // ---------------------------------------------
    const drawConnections = () => {
        connectionLinesSvg.innerHTML = ''; // 기존 선 모두 지우기

        // 연결 관계 정의 (부모 -> 자식)
        const connections = [
            { parent: 'logo', child: '소개' },
            { parent: 'logo', child: '1호' },
            { parent: '소개', child: '소개글' },
            { parent: '1호', children: issue1Articles.map(id => articleData[id].title) } // 1호 아래 모든 글
        ];

        // 노드들의 위치를 가져오는 헬퍼 함수
        const getNodeRect = (nodeId) => {
            const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
            if (nodeElement) {
                const rect = nodeElement.getBoundingClientRect();
                return {
                    x: rect.left + rect.width / 2, // 중앙 x
                    y: rect.top + rect.height / 2  // 중앙 y
                };
            }
            return null;
        };

        connections.forEach(conn => {
            const parentPos = getNodeRect(conn.parent);

            if (parentPos) {
                const children = conn.children || [conn.child]; // child가 단일일 수도, 배열일 수도 있음

                children.forEach(childId => {
                    const childPos = getNodeRect(childId);
                    if (childPos) {
                        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

                        // 곡선 경로 (베지어 곡선)
                        const startX = parentPos.x;
                        const startY = parentPos.y;
                        const endX = childPos.x;
                        const endY = childPos.y;

                        // 제어점 (느슨하게 축 늘어진 곡선 느낌)
                        // x축은 부모와 자식 중간, y축은 아래로 더 내려가도록
                        const controlX1 = startX + (endX - startX) * 0.25;
                        const controlY1 = startY + (endY - startY) * 0.75; // Y축을 더 많이 내려서 늘어진 느낌
                        const controlX2 = startX + (endX - startX) * 0.75;
                        const controlY2 = startY + (endY - startY) * 0.25;

                        // 모바일 환경에서는 수직으로 길게 늘어지도록 제어점 조정
                        if (window.innerWidth <= 768) {
                            // 거의 수직선에 가깝게
                            const midY = startY + (endY - startY) * 0.5;
                            path.setAttribute('d', `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`);
                        } else {
                            // 부드러운 곡선
                             path.setAttribute('d', `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`);
                        }

                        connectionLinesSvg.appendChild(path);
                    }
                });
            }
        });
    };

    // ---------------------------------------------
    // 3. 글 내용 표시 함수
    // ---------------------------------------------
    const showArticle = (articleId) => {
        const article = articleData[articleId];
        if (!article) {
            console.error('Article not found:', articleId);
            return;
        }

        articleTitle.textContent = article.title;
        articleMeta.textContent = `${article.author} | ${article.date}`;
        articleBody.innerHTML = article.content.map(p => `<p>${p}</p>`).join(''); // 배열의 각 문단을 <p>태그로 감싸기

        emptyState.style.display = 'none';
        articleDisplay.style.display = 'block';

        // 현재 활성화된 노드 강조
        document.querySelectorAll('.node').forEach(node => node.classList.remove('active'));
        const activeNode = document.querySelector(`[data-article-id="${articleId}"]`);
        if (activeNode) {
            activeNode.classList.add('active');
        }

        contentArea.scrollTop = 0; // 새 글을 볼 때 스크롤을 맨 위로
    };

    // ---------------------------------------------
    // 4. 이벤트 리스너 및 초기화
    // ---------------------------------------------
    // 노드 클릭 이벤트 (글 내용 표시)
    sidebar.addEventListener('click', (event) => {
        const node = event.target.closest('.node');
        if (node && node.dataset.articleId) {
            showArticle(node.dataset.articleId);
        }
    });

    // 화면 크기 변경 시 선 다시 그리기
    window.addEventListener('resize', drawConnections);

    // 초기 로드 시 선 그리기
    drawConnections();

    // 초기에는 '소개글'을 표시
    showArticle('intro_rekisi');
});