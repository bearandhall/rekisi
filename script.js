document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.getElementById('wrapper');
    const connectionLinesSvg = document.getElementById('connection-lines');
    const issue1ChildrenContainer = document.getElementById('issue-1-children-container');
    const logoNode = document.getElementById('logo-node');
    const introNode = document.getElementById('intro-node');
    const issue1Node = document.getElementById('issue-1-node');
    
    const modal = document.getElementById('article-modal');
    const closeBtn = document.querySelector('.close-btn');
    const modalTitle = document.getElementById('modal-article-title');
    const modalMeta = document.getElementById('modal-article-meta');
    const modalAuthorIntro = document.getElementById('modal-author-intro');
    const modalBody = document.getElementById('modal-article-body');

    let draggedElement = null;
    let offsetX, offsetY;

    const articleData = window.articleData || {};
    const issue1Articles = Object.keys(articleData).filter(id => id !== 'intro_rekisi');

    const HORIZONTAL_OFFSET = 180; 
    const AUTHOR_TITLE_OFFSET = 150;
    const VERTICAL_SPACING = 50;
    const INITIAL_LEFT = 50;

    let articleNodes = [];

    // ---------------------------------------------
    // 초기 노드 배치 구조 설정
    // ---------------------------------------------
    
    const isMobileView = () => window.innerWidth <= 600;
    const MOBILE_TOP_OFFSET = 150; // 모바일에서 상단에서 띄울 Y축 오프셋
    
    const logoY = isMobileView() ? MOBILE_TOP_OFFSET : 50;
    
    // 소개 노드의 X/Y 위치 설정
    const introY = isMobileView() ? MOBILE_TOP_OFFSET : 50;
    const introX = isMobileView() ? INITIAL_LEFT + 150 : INITIAL_LEFT + 250; 

    // 1호 노드의 X/Y 위치 설정
    const issue1Y = isMobileView() ? MOBILE_TOP_OFFSET + 100 : 200;
    const issue1X = INITIAL_LEFT;

    // 로고 노드
    logoNode.style.left = `${INITIAL_LEFT}px`;
    logoNode.style.top = `${logoY}px`; 
    
    // 소개 노드 
    introNode.style.left = `${introX}px`; 
    introNode.style.top = `${introY}px`; 

    // 1호 노드 
    issue1Node.style.left = `${issue1X}px`;
    issue1Node.style.top = `${issue1Y}px`; 

    // ---------------------------------------------
    // 1. 초기 버튼들에 액션 버튼 추가 및 노드 생성 (유지)
    // ---------------------------------------------

    const addActionButton = (node, actionType) => {
        if (node.dataset.nodeId === 'logo') return; 

        const btn = document.createElement('div');
        btn.classList.add('node-action-btn');
        btn.dataset.actionType = actionType; 
        btn.innerHTML = actionType === 'toggle' ? '목록' : '&#x25A1;';
        node.appendChild(btn);
    };

    addActionButton(introNode, 'intro');
    addActionButton(issue1Node, 'toggle');


    issue1Articles.forEach((articleId) => {
        const article = articleData[articleId];
        
        const authorNode = document.createElement('div');
        authorNode.classList.add('draggable-node', 'node-author');
        authorNode.dataset.nodeId = article.author;
        authorNode.dataset.authorInfo = article.author; 
        authorNode.textContent = article.author;
        addActionButton(authorNode, 'author-modal'); 
        authorNode.style.display = 'none'; 
        issue1ChildrenContainer.appendChild(authorNode);
        articleNodes.push(authorNode);
        
        const titleNode = document.createElement('div');
        titleNode.classList.add('draggable-node', 'node-title', 'article-link');
        titleNode.dataset.nodeId = article.title; 
        titleNode.dataset.articleId = articleId; 
        titleNode.textContent = article.title;
        addActionButton(titleNode, 'article-modal'); 
        titleNode.style.display = 'none'; 
        issue1ChildrenContainer.appendChild(titleNode);
        articleNodes.push(titleNode);
    });
    
    // ---------------------------------------------
    // 2. Drag & Drop 로직
    // ---------------------------------------------
    
    const getClientCoords = (e) => {
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    };

    const startDrag = (e) => {
        const targetNode = e.target.closest('.draggable-node');
        
        // 버튼 클릭 시 드래그 시작 막고 preventDefault() 호출
        if (e.target.closest('.node-action-btn')) {
            e.preventDefault(); 
            return;
        }

        // 드래그 가능한 노드가 아니면 함수 종료. (스크롤 허용)
        if (!targetNode) return;

        draggedElement = targetNode;
        
        const coords = getClientCoords(e);
        const rect = targetNode.getBoundingClientRect();
        offsetX = coords.x - rect.left;
        offsetY = coords.y - rect.top;
        
        draggedElement.style.zIndex = 40; 

        // 드래그 시작 시 기본 동작(스크롤) 차단
        e.preventDefault(); 
    };

    const drag = (e) => {
        if (!draggedElement) return;

        e.preventDefault(); 
            
        const coords = getClientCoords(e);
        let newX = coords.x - offsetX;
        let newY = coords.y - offsetY;
        
        newX += wrapper.scrollLeft; 
        newY += wrapper.scrollTop;

        draggedElement.style.left = `${newX}px`;
        draggedElement.style.top = `${newY}px`;
        
        // 드래그 중 선 연결 업데이트
        drawConnections(); 
    };

    const endDrag = () => {
        if (draggedElement) {
            draggedElement.style.zIndex = 30;
        }
        draggedElement = null;
    };
    
    // 이벤트 리스너
    wrapper.addEventListener('mousedown', startDrag);
    wrapper.addEventListener('mousemove', drag);
    wrapper.addEventListener('mouseup', endDrag);

    wrapper.addEventListener('touchstart', startDrag);
    wrapper.addEventListener('touchmove', drag);
    wrapper.addEventListener('touchend', endDrag);


    // ---------------------------------------------
    // 3. SVG 연결선 동적 그리기 (스크롤 시 재계산)
    // ---------------------------------------------
    
    // ★수정 1: 노드의 wrapper 기준 절대 좌표와 크기를 반환하는 함수 (getBoundingClientRect 제거)
    const getNodeWrapperPos = (nodeId) => {
        const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
        if (!nodeElement) return null;

        // wrapper 기준 top/left 값은 style에서 가져옵니다 (단위: px)
        const left = parseFloat(nodeElement.style.left || 0);
        const top = parseFloat(nodeElement.style.top || 0);

        // 노드의 실제 렌더링 크기를 가져옵니다.
        const width = nodeElement.offsetWidth;
        const height = nodeElement.offsetHeight;

        return { left, top, width, height };
    };
    
    let rafHandle = null; 

    const drawConnections = () => {
        if (rafHandle) {
            cancelAnimationFrame(rafHandle);
        }
        
        rafHandle = requestAnimationFrame(() => {
            connectionLinesSvg.innerHTML = '';
            
            // ★수정 2: SVG 크기를 wrapper의 전체 스크롤 영역 크기로 설정
            connectionLinesSvg.style.width = `${wrapper.scrollWidth}px`;
            connectionLinesSvg.style.height = `${wrapper.scrollHeight}px`; 

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
            
            connections.forEach(conn => {
                // ★수정 3: wrapper 기준 좌표 사용 (getNodeWrapperPos)
                const parentRect = getNodeWrapperPos(conn.parentId);
                const childElement = document.querySelector(`[data-node-id="${conn.childId}"]`);
                const childRect = getNodeWrapperPos(conn.childId);
                
                if (parentRect && childRect && childElement && childElement.style.display !== 'none') {
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    
                    // SVG는 이제 wrapper 기준이므로, 노드의 absolute top/left를 그대로 사용합니다.
                    const svgStartX = parentRect.left + (conn.parentId === 'logo' ? (parentRect.width * 0.5) : parentRect.width);
                    const svgStartY = parentRect.top + (conn.parentId === 'logo' ? parentRect.height : parentRect.height / 2);
                    
                    const svgEndX = childRect.left; 
                    const svgEndY = childRect.top + childRect.height / 2;
                    
                    let dPath;

                    if (conn.type === 'logo') {
                        dPath = `M ${svgStartX} ${svgStartY} C ${svgStartX + 30} ${svgStartY + 30}, ${svgEndX - 30} ${svgEndY}, ${svgEndX} ${svgEndY}`;
                    } else if (conn.type === 'straight' || conn.type === 'parent') {
                        // 부드러운 곡선
                        const offset = 80; 
                        dPath = `M ${svgStartX} ${svgStartY} C ${svgStartX + offset} ${svgStartY}, ${svgEndX - offset} ${svgEndY}, ${svgEndX} ${svgEndY}`;
                    }
                    
                    path.setAttribute('d', dPath);
                    connectionLinesSvg.appendChild(path);
                }
            });
            rafHandle = null; 
        });
    };

    // ---------------------------------------------
    // 4. 액션 버튼 클릭 및 모달 로직 (유지)
    // ---------------------------------------------
    
    wrapper.addEventListener('click', (e) => {
        const actionBtn = e.target.closest('.node-action-btn');
        if (!actionBtn) return;
        
        const actionType = actionBtn.dataset.actionType;
        const parentNode = actionBtn.closest('.draggable-node');
        const articleId = parentNode.dataset.articleId;
        const nodeId = parentNode.dataset.nodeId;
        
        e.stopPropagation(); 

        switch (actionType) {
            case 'toggle':
                toggleIssueChildren(parentNode);
                break;
            case 'intro':
                const introArticle = articleData['intro_rekisi'];
                showArticleModal(introArticle.title, 'REKISI 편집부', null, introArticle.content, 'article');
                break;
            case 'article-modal':
                const article = articleData[articleId];
                showArticleModal(article.title, article.author, article.author_intro, article.content, 'article');
                break;
            case 'author-modal':
                handleAuthorClick(nodeId);
                break;
            default:
                break;
        }
    });

    const toggleIssueChildren = (togglerNode) => {
        const isExpanded = togglerNode.classList.toggle('expanded');
        
        if (isExpanded) {
            const parentX = togglerNode.offsetLeft;
            const parentY = togglerNode.offsetTop;
            
            articleNodes.forEach((node, index) => {
                const articleIndex = Math.floor(index / 2);
                const isAuthorNode = index % 2 === 0;
                
                let newX = parentX + HORIZONTAL_OFFSET;
                let newY = parentY + (articleIndex * VERTICAL_SPACING);

                if (!isAuthorNode) {
                    newX += AUTHOR_TITLE_OFFSET;
                }
                
                node.style.left = `${newX}px`;
                node.style.top = `${newY}px`;
                node.style.display = 'block';
            });
            
        } else {
            articleNodes.forEach(node => {
                node.style.display = 'none';
            });
        }

        setTimeout(drawConnections, 200); 
    };

    
    const hideIssueChildren = () => {
        issue1Node.classList.remove('expanded');
        articleNodes.forEach(node => {
            node.style.display = 'none';
        });
    };
    
    const handleAuthorClick = (authorName) => {
        const article = issue1Articles.map(id => articleData[id]).find(a => a.author === authorName);
        
        if (article && article.author_intro) {
             showArticleModal(
                 `저자: ${authorName}`, 
                 null, 
                 article.author_intro, 
                 ['이 곳에서 작가의 다른 글을 확인하실 수 있습니다.'],
                 'author'
             );
        } else {
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
        modalTitle.textContent = title;
        modalBody.innerHTML = content.map(p => `<p>${p}</p>`).join('');
        
        if (type === 'article' && author) {
             modalMeta.textContent = author;
             modalAuthorIntro.innerHTML = authorIntro ? `<strong>저자 소개:</strong> ${authorIntro}` : '';
        } else if (type === 'author') {
             modalMeta.textContent = '';
             modalAuthorIntro.innerHTML = authorIntro;
        } else {
             modalMeta.textContent = '';
             modalAuthorIntro.innerHTML = '';
        }

        modal.style.display = 'block';
        modal.scrollTop = 0;
    };
    
    const closeModal = () => {
        modal.style.display = 'none';
    };
    
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) { closeModal(); }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') { closeModal(); }
    });

    window.addEventListener('resize', drawConnections);
    // 스크롤 이벤트 발생 시 requestAnimationFrame으로 래핑하여 호출 
    wrapper.addEventListener('scroll', drawConnections); 
    
    setTimeout(drawConnections, 10);
});
