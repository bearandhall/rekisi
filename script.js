document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.getElementById('wrapper');
    const connectionLinesSvg = document.getElementById('connection-lines');
    const issue1ChildrenContainer = document.getElementById('issue-1-children-container');
    const logoNode = document.getElementById('logo-node');
    const introNode = document.getElementById('intro-node');
    const issue1Node = document.getElementById('issue-1-node');
    
    // 모달 관련 요소
    const modal = document.getElementById('article-modal');
    const closeBtn = document.querySelector('.close-btn');
    const modalTitle = document.getElementById('modal-article-title');
    const modalMeta = document.getElementById('modal-article-meta');
    const modalAuthorIntro = document.getElementById('modal-author-intro');
    const modalBody = document.getElementById('modal-article-body');

    let draggedElement = null;
    let offsetX, offsetY;
    let isDragging = false;
    let clickStartX, clickStartY;
    const DRAG_THRESHOLD = 5; 

    const articleData = window.articleData || {};
    const issue1Articles = Object.keys(articleData).filter(id => id !== 'intro_rekisi');

    // ---------------------------------------------
    // 1. 글 목록 동적 생성 및 초기 배치 (★오른쪽 배치 수정★)
    // ---------------------------------------------
    
    // "1호" 버튼의 현재 위치를 기준으로 글 목록을 오른쪽에 배치하기 위한 오프셋
    const ISSUE_1_X = parseFloat(issue1Node.style.left);
    const ISSUE_1_Y = parseFloat(issue1Node.style.top);
    const HORIZONTAL_OFFSET = 180; // "1호" 버튼으로부터 오른쪽으로 180px 떨어진 곳에서 시작
    const VERTICAL_SPACING = 50;

    let articleNodes = [];

    issue1Articles.forEach((articleId, index) => {
        const article = articleData[articleId];
        // 배치: 1호 버튼의 오른쪽 + 스크롤 Y 위치
        const initialY = ISSUE_1_Y + (index * VERTICAL_SPACING) - 50; // 시작점 조정
        
        // 저자 노드
        const authorNode = document.createElement('div');
        authorNode.classList.add('draggable-node', 'node-author');
        authorNode.dataset.nodeId = article.author;
        authorNode.dataset.authorInfo = article.author; // 저자 정보 검색을 위해 추가
        authorNode.style.left = `${ISSUE_1_X + HORIZONTAL_OFFSET}px`;
        authorNode.style.top = `${initialY}px`;
        authorNode.textContent = article.author;
        authorNode.style.display = 'none'; 
        issue1ChildrenContainer.appendChild(authorNode);
        articleNodes.push(authorNode);
        
        // 제목 노드 (클릭 가능)
        const titleNode = document.createElement('div');
        titleNode.classList.add('draggable-node', 'node-title', 'article-link');
        titleNode.dataset.nodeId = article.title; 
        titleNode.dataset.articleId = articleId; 
        titleNode.style.left = `${ISSUE_1_X + HORIZONTAL_OFFSET + 150}px`; // 저자 노드로부터 150px 오른쪽
        titleNode.style.top = `${initialY}px`;
        titleNode.textContent = article.title;
        titleNode.style.display = 'none'; 
        issue1ChildrenContainer.appendChild(titleNode);
        articleNodes.push(titleNode);
    });
    
    // ---------------------------------------------
    // 2. Drag & Drop 로직 (★터치 이벤트 추가 - 문제 3 해결★)
    // ---------------------------------------------
    
    const getClientCoords = (e) => {
        // 터치 이벤트와 마우스 이벤트 모두 처리
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    };

    const startDrag = (e) => {
        // e.preventDefault(); // 터치 스크롤 방지를 위해 CSS에서 touch-action: none 사용
        
        const targetNode = e.target.closest('.draggable-node');
        if (!targetNode) return;

        draggedElement = targetNode;
        isDragging = false;
        
        const coords = getClientCoords(e);
        clickStartX = coords.x;
        clickStartY = coords.y;
        
        // 드래그 시작 시 요소의 초기 위치와 마우스 커서 위치 차이 계산
        const rect = targetNode.getBoundingClientRect();
        offsetX = coords.x - rect.left;
        offsetY = coords.y - rect.top;
        
        draggedElement.style.zIndex = 40; 
    };

    const drag = (e) => {
        if (!draggedElement) return;

        const coords = getClientCoords(e);
        const deltaX = Math.abs(coords.x - clickStartX);
        const deltaY = Math.abs(coords.y - clickStartY);

        if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
            isDragging = true;
        }

        if (isDragging) {
            let newX = coords.x - offsetX;
            let newY = coords.y - offsetY;
            
            // Note: 현재 wrapper는 overflow-x: auto를 사용하므로, 
            // 드래그된 요소의 좌표를 wrapper의 scrollLeft/Top으로 보정해야 합니다.
            newX += wrapper.scrollLeft; 
            newY += wrapper.scrollTop;

            // CSS 위치 업데이트
            draggedElement.style.left = `${newX}px`;
            draggedElement.style.top = `${newY}px`;
            
            requestAnimationFrame(drawConnections);
        }
    };

    const endDrag = (e) => {
        if (draggedElement) {
            draggedElement.style.zIndex = 30;
            
            if (!isDragging) {
                // 드래그 없이 클릭했을 때만 클릭 이벤트 처리
                handleNodeClick(draggedElement);
            }
        }
        draggedElement = null;
        isDragging = false;
    };
    
    // 마우스 이벤트 리스너
    wrapper.addEventListener('mousedown', startDrag);
    wrapper.addEventListener('mousemove', drag);
    wrapper.addEventListener('mouseup', endDrag);

    // 터치 이벤트 리스너 (모바일 지원)
    wrapper.addEventListener('touchstart', startDrag);
    wrapper.addEventListener('touchmove', drag);
    wrapper.addEventListener('touchend', endDrag);

    // ---------------------------------------------
    // 3. SVG 연결선 동적 그리기 (유지)
    // ---------------------------------------------

    // (drawConnections 함수는 이전과 동일하게 유지됩니다. 
    // 터치/마우스 이벤트에서 requestAnimationFrame을 통해 호출됩니다.)
    const drawConnections = () => {
        connectionLinesSvg.innerHTML = '';
        
        const connections = [];

        connections.push({ parentId: 'logo', childId: '소개', type: 'logo' });
        connections.push({ parentId: 'logo', childId: '1호', type: 'logo' });

        if (issue1Node.classList.contains('expanded')) {
            issue1Articles.forEach(articleId => {
                const article = articleData[articleId];
                connections.push({ parentId: '1호', childId: article.author, type: 'parent' });
                connections.push({ parentId: article.author, childId: article.title, type: 'straight' });
            });
        }
        
        const getNodeRect = (nodeId) => {
            const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
            if (!nodeElement) return null;

            const rect = nodeElement.getBoundingClientRect();
            
            let startX, startY;
            
            if (nodeId === 'logo') { 
                startX = rect.left + rect.width / 2; 
                startY = rect.bottom; 
            } else {
                startX = rect.left + rect.width;
                startY = rect.top + rect.height / 2;
            }
            
            return { 
                x: startX, 
                y: startY, 
                width: rect.width, 
                height: rect.height,
                offsetLeft: nodeElement.offsetLeft,
                offsetTop: nodeElement.offsetTop
            }; 
        };

        connections.forEach(conn => {
            const parentPos = getNodeRect(conn.parentId);
            const childNode = document.querySelector(`[data-node-id="${conn.childId}"]`);
            const childPos = getNodeRect(conn.childId);
            
            if (parentPos && childPos && childNode) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                
                // SVG 좌표는 window/wrapper의 스크롤 위치를 반영해야 합니다.
                const scrollLeft = wrapper.scrollLeft;
                const scrollTop = wrapper.scrollTop;

                // 시작점: 부모 노드의 절대 좌표 (GBCR 대신 offsetLeft/Top 사용)
                const startX = parentPos.offsetLeft + (conn.parentId === 'logo' ? parentPos.width / 2 : parentPos.width);
                const startY = parentPos.offsetTop + (conn.parentId === 'logo' ? parentPos.height : parentPos.height / 2);
                
                // 끝점: 자식 노드의 절대 좌표
                const endX = childPos.offsetLeft; // 왼쪽 끝
                const endY = childPos.offsetTop + childPos.height / 2;

                // SVG 뷰포트 좌표 (절대 좌표 - 스크롤 위치)
                const svgStartX = startX - scrollLeft;
                const svgStartY = startY - scrollTop;
                const svgEndX = endX - scrollLeft;
                const svgEndY = endY - scrollTop;
                
                const distanceX = svgEndX - svgStartX;
                const distanceY = svgEndY - svgStartY;

                let dPath;

                if (conn.type === 'logo') {
                    dPath = `M ${svgStartX} ${svgStartY} C ${svgStartX + 30} ${svgStartY + 30}, ${svgEndX - 30} ${svgEndY}, ${svgEndX} ${svgEndY}`;
                } else if (conn.type === 'straight') {
                    const midX = svgStartX + distanceX * 0.5;
                    dPath = `M ${svgStartX} ${svgStartY} L ${midX} ${svgStartY} L ${midX} ${svgEndY} L ${svgEndX} ${svgEndY}`;
                } else {
                    dPath = `M ${svgStartX} ${svgStartY} C ${svgStartX + 60} ${svgStartY}, ${svgEndX - 60} ${svgEndY}, ${svgEndX} ${svgEndY}`;
                }
                
                path.setAttribute('d', dPath);
                connectionLinesSvg.appendChild(path);
            }
        });
    };


    // ---------------------------------------------
    // 4. 클릭 이벤트 및 모달 처리 로직 (★저자 클릭 모달 추가 - 문제 2 해결★)
    // ---------------------------------------------
    
    const handleNodeClick = (node) => {
        if (node.dataset.nodeId === 'logo') {
            hideIssueChildren();
            closeModal();
            drawConnections();
            return;
        }

        if (node.dataset.nodeId === '소개') {
            hideIssueChildren();
            const introArticle = articleData['intro_rekisi'];
            showArticleModal(introArticle.title, 'REKISI 편집부', null, introArticle.content, 'article');
            drawConnections();
            return;
        }

        if (node.dataset.nodeId === '1호') {
            toggleIssueChildren(node);
            return;
        }
        
        // ★저자 이름 클릭 시 모달 팝업★
        if (node.classList.contains('node-author')) {
            handleAuthorClick(node.dataset.nodeId);
            return;
        }
        
        // 개별 글 제목 클릭
        if (node.classList.contains('article-link')) {
            const articleId = node.dataset.articleId;
            const article = articleData[articleId];
            showArticleModal(article.title, article.author, article.author_intro, article.content, 'article');
            return;
        }
    };
    
    // 저자 이름 클릭 시 로직
    const handleAuthorClick = (authorName) => {
        // 해당 저자의 소개 정보를 articles.js에서 찾습니다.
        // 모든 글을 순회하며 해당 저자의 첫 번째 글을 찾아 소개를 가져옵니다.
        const article = issue1Articles.map(id => articleData[id]).find(a => a.author === authorName);
        
        if (article && article.author_intro) {
             showArticleModal(
                `저자: ${authorName}`, 
                null, // 메타 정보는 사용 안 함
                article.author_intro, 
                ['이 곳에서 작가의 다른 글을 확인하실 수 있습니다.'], // 간단한 추가 메시지
                'author' // 모달 타입을 저자로 지정
            );
        } else {
            // 저자 소개 데이터가 없는 경우 처리
            showArticleModal(
                `저자: ${authorName}`,
                null,
                '아직 등록된 상세 저자 소개가 없습니다.',
                [],
                'author'
            );
        }
    };
    

    const showArticleModal = (title, author, authorIntro, content, type) => {
        // 모달 내용 채우기 (저자 소개 포함)
        modalTitle.textContent = title;
        modalBody.innerHTML = content.map(p => `<p>${p}</p>`).join('');
        
        // 저자/글에 따라 메타 정보와 저자 소개 표시 방식 변경
        if (type === 'article' && author) {
             modalMeta.textContent = author;
             modalAuthorIntro.innerHTML = authorIntro ? `<strong>저자 소개:</strong> ${authorIntro}` : '';
        } else if (type === 'author') {
             modalMeta.textContent = '';
             modalAuthorIntro.innerHTML = authorIntro; // authorIntro 필드에 메시지가 포함됨
        } else {
             modalMeta.textContent = '';
             modalAuthorIntro.innerHTML = '';
        }

        modal.style.display = 'block';
        modal.scrollTop = 0;
    };
    
    // ... (toggleIssueChildren, hideIssueChildren, closeModal 함수 유지)

    const toggleIssueChildren = (togglerNode) => {
        const isExpanded = togglerNode.classList.toggle('expanded');
        
        articleNodes.forEach(node => {
            node.style.display = isExpanded ? 'block' : 'none';
        });

        setTimeout(drawConnections, 50); 
    };
    
    const hideIssueChildren = () => {
        issue1Node.classList.remove('expanded');
        articleNodes.forEach(node => {
            node.style.display = 'none';
        });
    };

    const closeModal = () => {
        modal.style.display = 'none';
    };
    
    // 모달 닫기 이벤트 리스너
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeModal();
        }
    });

    // 초기 선 그리기
    window.addEventListener('resize', drawConnections);
    setTimeout(drawConnections, 10);
});
