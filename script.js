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
    
    // 소개글 노드 생성
    const introSectionChildren = document.querySelector('#intro-section .menu-children');
    introSectionChildren.innerHTML = `<div class="node title-node article-link" data-node-id="소개글" data-article-id="intro_rekisi">레키시는 ...</div>`;

    // 1호 글 목록 노드 생성
    issue1Articles.forEach(articleId => {
        const article = articleData[articleId];
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('article-item');
        itemDiv.dataset.articleId = articleId; 
        
        // 저자 노드
        const authorNode = document.createElement('div');
        authorNode.classList.add('node', 'author-node');
        authorNode.dataset.nodeId = article.author;
        authorNode.textContent = article.author;
        
        // 제목 노드
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
        ];

        // '소개' 하위 메뉴 연결 추가
        const introChildren = document.querySelector('#intro-section .menu-children');
        if (introChildren.classList.contains('expanded')) {
            connections.push({ parent: '소개', child: '소개글' });
        }


        // '1호' 하위 메뉴 연결 추가
        const articlesContainer = document.querySelector('#issue-1-section .articles-list');
        const activeArticleId = contentArea.classList.contains('active') ? window.location.hash.substring(1) : null;

        if (articlesContainer.classList.contains('expanded')) {
             issue1Articles.forEach(articleId => {
                 const article = articleData[articleId];
                 
                 // 글이 선택된 상태이고 현재 글이 아니라면 선을 그리지 않음 (목록 숨김 효과)
                 if (activeArticleId && activeArticleId !== articleId && articleId !== 'intro_rekisi') {
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
                    // 로고에서 뻗어나가는 선: 짧고 급격한 곡선
                    path.setAttribute('d', `M ${svgStartX} ${svgStartY} C ${svgStartX + 10} ${svgStartY}, ${svgEndX - 10} ${svgEndY}, ${svgEndX} ${svgEndY}`);
                } else if (conn.parent === '소개' || conn.parent === '1호') {
                    // 1단계 하위 노드: 중간 곡선
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
    // 3. 토글 및 화면 전환 함수
    // ---------------------------------------------

    const toggleArticlesList = (target) => {
        const list = target.closest('.menu-section').querySelector('.menu-children');
        const isExpanded = list.classList.contains('expanded');
        
        // 목록 숨김 해제 (글 보기 상태가 아닐 때만 목록 전체 표시)
        if (!contentArea.classList.contains('active')) {
             document.querySelectorAll('.articles-list .article-item').forEach(item => item.style.display = 'flex');
        }

        if (isExpanded) {
            list.classList.remove('expanded');
        } else {
            list.classList.add('expanded');
        }

        setTimeout(drawConnections, 300);
    };
    
    // 화면 전환 및 목록 정리
    const showArticle = (articleId) => {
        const article = articleData[articleId];
        const allArticleItems = document.querySelectorAll('.articles-list .article-item');
        
        if (!article) {
            // 초기 화면 복귀: 글 내용 슬라이드 아웃
            contentArea.classList.remove('active'); 
            
            // 모든 글 항목 다시 표시 (문제 5 해결)
            allArticleItems.forEach(item => item.style.display = 'flex');

            document.querySelectorAll('.node').forEach(node => node.classList.remove('active'));
            if (window.location.hash) {
                window.history.pushState(null, null, '/');
            }
            setTimeout(drawConnections, 400); 
            return;
        }

        // 내용 채우기 (유지)
        document.getElementById('article-title').textContent = article.title;
        document.getElementById('article-meta').textContent = `${article.author} | ${article.date}`;
        document.getElementById('article-body').innerHTML = article.content.map(p => `<p>${p}</p>`).join('');

        // 글 내용 슬라이드 인
        contentArea.classList.add('active'); 
        
        // ★선택된 글 제외하고 목록 숨기기 (문제 5 해결)★
        allArticleItems.forEach(item => {
            if (item.dataset.articleId === articleId || articleId === 'intro_rekisi') {
                 // 소개글 클릭 시에는 모든 1호 목록은 숨기지 않음
                 item.style.display = 'flex';
            } else {
                 // 1호 개별 글 클릭 시, 해당 글만 남기고 나머지는 숨김
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
        setTimeout(drawConnections, 400);
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

    // 초기 로드 시: 하위 메뉴 숨기기 및 선 그리기
    document.querySelectorAll('.menu-children').forEach(list => {
        list.classList.remove('expanded');
    });

    const initialArticleId = window.location.hash.substring(1);
    if (initialArticleId) {
        showArticle(initialArticleId);
        
        // '소개' 또는 '1호' 메뉴를 자동으로 펼침
        if (initialArticleId === 'intro_rekisi') {
             document.querySelector('#intro-section .menu-children').classList.add('expanded');
        } else if (articleData[initialArticleId]) {
             document.querySelector('#issue-1-section .menu-children').classList.add('expanded');
        }
    } else {
        // 초기에는 글 내용 영역 숨김
        showArticle(null); 
    }
    
    setTimeout(drawConnections, 10);
});
