document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const contentArea = document.getElementById('content-area');
    const articleDisplay = document.getElementById('article-display');
    const emptyState = document.getElementById('empty-state');
    const connectionLinesSvg = document.getElementById('connection-lines');
    const articlesListDiv = document.querySelector('.articles-list');
    const logoElement = document.getElementById('logo');
    
    // ---------------------------------------------
    // 1. 글 목록 동적 생성 및 노드 데이터 설정 (저자/제목 분리)
    // ---------------------------------------------
    const issue1Articles = Object.keys(articleData).filter(id => id !== 'intro_rekisi');
    
    // 소개글 노드를 별도로 정의합니다. (소개 -> 레키시는 ... 연결)
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
    // 2. SVG 연결선 그리기 함수 (★가장 크게 수정됨★)
    // ---------------------------------------------
    const drawConnections = () => {
        connectionLinesSvg.innerHTML = '';
        
        // 연결 관계 정의: (부모 노드 ID) -> (자식 노드 ID)
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
                 // 1호 -> 저자 연결
                 connections.push({ parent: '1호', child: article.author });
                 // 저자 -> 제목 연결
                 connections.push({ parent: article.author, child: article.title });
             });
        }
        
        // 노드들의 위치와 사이드바 스크롤 위치를 고려하여 정확한 뷰포트 좌표를 가져오는 헬퍼 함수
        const getNodeRect = (nodeId) => {
            const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
            if (!nodeElement) return null;

            const rect = nodeElement.getBoundingClientRect();
            // 뷰포트 기준 좌표
            const x = rect.left + rect.width; // 노드 오른쪽 끝
            const y = rect.top + rect.height / 2; // 노드 중앙 y
            
            return { x, y };
        };

        connections.forEach(conn => {
            const parentPos = getNodeRect(conn.parent);
            // 자식 노드는 약간 왼쪽에서 시작하도록 조정
            const childNode = document.querySelector(`[data-node-id="${conn.child}"]`);
            const childPos = getNodeRect(conn.child);
            
            if (parentPos && childPos) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const startX = parentPos.x;
                const startY = parentPos.y;
                const endX = childPos.x - childNode.offsetWidth; // ★ 자식 노드 왼쪽에서 시작
                const endY = childPos.y;

                // 베지어 곡선 제어점 (느슨하게 축 늘어진 곡선 느낌 강화)
                const distanceX = endX - startX;
                const distanceY = endY - startY;

                const controlX1 = startX + distanceX * 0.1;
                const controlY1 = startY + distanceY * 0.9; 
                const controlX2 = startX + distanceX * 0.9;
                const controlY2 = startY + distanceY * 0.1;

                // 연결선 그리기 (로고와 소개/1호는 직선에 가깝게, 나머지는 곡선)
                if (conn.parent === 'logo') {
                    path.setAttribute('d', `M ${startX} ${startY} L ${endX} ${endY}`);
                } else if (conn.parent === '소개' || conn.parent === '1호') {
                    // 1단계 하위 노드: 1차 곡선
                    path.setAttribute('d', `M ${startX} ${startY} C ${startX + 50} ${startY}, ${endX - 50} ${endY}, ${endX} ${endY}`);
                } else {
                    // 2단계 하위 노드 (저자->제목): 축 늘어진 곡선
                    path.setAttribute('d', `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`);
                }
                
                connectionLinesSvg.appendChild(path);
            }
        });
    };

    // ---------------------------------------------
    // 3. 토글 및 라우팅 함수
    // ---------------------------------------------

    // 글 목록 토글 함수
    const toggleArticlesList = (target) => {
        const list = target.closest('.menu-section').querySelector('.articles-list');
        if (list) {
            const isCollapsed = list.classList.contains('collapsed');
            
            if (isCollapsed) {
                // 펼치기
                list.style.maxHeight = list.scrollHeight + "px"; // 내용 높이만큼 설정
                list.classList.remove('collapsed');
            } else {
                // 접기
                list.style.maxHeight = list.scrollHeight + "px"; // 애니메이션을 위해 현재 높이 설정
                setTimeout(() => {
                    list.style.maxHeight = "0"; 
                    list.classList.add('collapsed');
                }, 10); // 작은 딜레이 후 접는 애니메이션 시작
            }

            // 토글 후 선 다시 그리기
            setTimeout(drawConnections, 300); // CSS transition 시간 후 실행
        }
    };
    
    const showArticle = (articleId) => {
        const article = articleData[articleId];
        
        // 내용 숨김 (초기화면 유지 로직)
        if (!article) {
            emptyState.style.display = 'block';
            articleDisplay.style.display = 'none';
            document.querySelectorAll('.node').forEach(node => node.classList.remove('active'));
            // 해시가 있다면 제거
            if (window.location.hash) {
                window.history.pushState(null, null, '/');
            }
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
        
        // 해시 라우팅: 주소창 업데이트 
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
                // 글 제목 클릭 시
                showArticle(node.dataset.articleId);
            } else if (node.classList.contains('toggler')) {
                // '1호' (토글러) 클릭 시
                toggleArticlesList(node);
            }
        }
    });

    // 로고 클릭 이벤트 
    logoElement.addEventListener('click', () => {
        showArticle(null); // 아무것도 표시하지 않고 초기 상태로 복귀
    });


    // 주소창 해시 변경 감지
    window.addEventListener('hashchange', () => {
        const articleIdFromHash = window.location.hash.substring(1); 
        if (articleIdFromHash) {
            showArticle(articleIdFromHash);
            
            // 1호 글을 직접 방문하면 1호 목록을 펼치고 선을 다시 그림
            if (articleData[articleIdFromHash] && articleIdFromHash !== 'intro_rekisi') {
                 const articlesList = document.querySelector('#issue-1-section .articles-list');
                 if(articlesList.classList.contains('collapsed')) {
                     articlesList.style.maxHeight = articlesList.scrollHeight + "px";
                     articlesList.classList.remove('collapsed');
                     setTimeout(drawConnections, 300);
                 }
            }

        } else {
            // 해시가 없는 경우 초기 상태로 복귀 (로고 클릭과 동일)
            showArticle(null); 
        }
    });

    window.addEventListener('resize', drawConnections);
    sidebar.addEventListener('scroll', drawConnections); // 사이드바 스크롤 시 선 다시 그리기

    // 초기 로드 시: 해시가 없으면 아무것도 표시하지 않음 (문제 2 해결)
    const initialArticleId = window.location.hash.substring(1);
    if (initialArticleId) {
        showArticle(initialArticleId);
    } else {
        showArticle(null); // 빈 화면 표시
    }
    
    // 초기 선 그리기
    setTimeout(drawConnections, 10);
});
