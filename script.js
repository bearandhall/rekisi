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

    // 초기 배치
    const isMobileView = () => window.innerWidth <= 600;
    const logoY = isMobileView() ? 150 : 50;
    logoNode.style.left = `${INITIAL_LEFT}px`;
    logoNode.style.top = `${logoY}px`;
    introNode.style.left = `${isMobileView() ? INITIAL_LEFT + 200 : INITIAL_LEFT + 250}px`;
    introNode.style.top = `${logoY + 30}px`;
    issue1Node.style.left = `${INITIAL_LEFT}px`;
    issue1Node.style.top = `${logoY + 100}px`;

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
        authorNode.textContent = article.author;
        addActionButton(authorNode, 'author-modal');
        authorNode.style.display = 'none';
        issue1ChildrenContainer.appendChild(authorNode);
        articleNodes.push(authorNode);
        
        const titleNode = document.createElement('div');
        titleNode.classList.add('draggable-node', 'node-title');
        titleNode.dataset.nodeId = article.title;
        titleNode.dataset.articleId = articleId;
        titleNode.textContent = article.title;
        addActionButton(titleNode, 'article-modal');
        titleNode.style.display = 'none';
        issue1ChildrenContainer.appendChild(titleNode);
        articleNodes.push(titleNode);
    });

    // 드래그 로직
    const getClientCoords = (e) => (e.touches ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY });

    const startDrag = (e) => {
        if (e.target.closest('.node-action-btn')) return;
        const targetNode = e.target.closest('.draggable-node');
        if (!targetNode) return;
        draggedElement = targetNode;
        const coords = getClientCoords(e);
        const rect = targetNode.getBoundingClientRect();
        offsetX = coords.x - rect.left;
        offsetY = coords.y - rect.top;
        draggedElement.style.zIndex = 40;
        e.preventDefault();
    };

    const drag = (e) => {
        if (!draggedElement) return;
        e.preventDefault();
        const coords = getClientCoords(e);
        draggedElement.style.left = `${coords.x - offsetX + wrapper.scrollLeft}px`;
        draggedElement.style.top = `${coords.y - offsetY + wrapper.scrollTop}px`;
        drawConnections();
    };

    const endDrag = () => { if (draggedElement) draggedElement.style.zIndex = 30; draggedElement = null; };

    wrapper.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', drag);
    window.addEventListener('mouseup', endDrag);
    wrapper.addEventListener('touchstart', startDrag);
    window.addEventListener('touchmove', drag);
    window.addEventListener('touchend', endDrag);

    const getNodeWrapperPos = (nodeId) => {
        const el = document.querySelector(`[data-node-id="${nodeId}"]`);
        return el ? { left: parseFloat(el.style.left), top: parseFloat(el.style.top), width: el.offsetWidth, height: el.offsetHeight } : null;
    };

    const drawConnections = () => {
        requestAnimationFrame(() => {
            connectionLinesSvg.innerHTML = '';
            connectionLinesSvg.style.width = `${wrapper.scrollWidth}px`;
            connectionLinesSvg.style.height = `${wrapper.scrollHeight}px`;

            const conns = [];
            conns.push({ parentId: 'logo', childId: '소개', type: 'logo' }, { parentId: 'logo', childId: '1호', type: 'logo' });
            if (issue1Node.classList.contains('expanded')) {
                issue1Articles.forEach(id => {
                    const a = articleData[id];
                    conns.push({ parentId: '1호', childId: a.author, type: 'parent' });
                    conns.push({ parentId: a.author, childId: a.title, type: 'straight' });
                });
            }

            conns.forEach(conn => {
                const p = getNodeWrapperPos(conn.parentId);
                const c = getNodeWrapperPos(conn.childId);
                const childEl = document.querySelector(`[data-node-id="${conn.childId}"]`);
                if (p && c && childEl.style.display !== 'none') {
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    
                    // ★ 클래스 추가 ★
                    if (conn.type === 'straight') path.classList.add('line-straight');

                    const sX = p.left + (conn.type === 'logo' ? p.width/2 : p.width);
                    const sY = p.top + (conn.type === 'logo' ? p.height : p.height/2);
                    const eX = c.left;
                    const eY = c.top + c.height/2;
                    const off = 80;
                    path.setAttribute('d', `M ${sX} ${sY} C ${sX + (conn.type === 'logo' ? 50 : off)} ${sY}, ${eX - (conn.type === 'logo' ? 50 : off)} ${eY}, ${eX} ${eY}`);
                    connectionLinesSvg.appendChild(path);
                }
            });
        });
    };

    // 토글 및 모달 클릭 로직 (이전과 동일)
    wrapper.addEventListener('click', (e) => {
        const btn = e.target.closest('.node-action-btn');
        if (!btn) return;
        const type = btn.dataset.actionType;
        const node = btn.closest('.draggable-node');
        if (type === 'toggle') {
            const exp = node.classList.toggle('expanded');
            articleNodes.forEach((n, i) => {
                if (exp) {
                    n.style.display = 'block';
                    n.style.left = `${node.offsetLeft + HORIZONTAL_OFFSET + (i%2 ? AUTHOR_TITLE_OFFSET : 0)}px`;
                    n.style.top = `${node.offsetTop + Math.floor(i/2) * VERTICAL_SPACING}px`;
                } else { n.style.display = 'none'; }
            });
            setTimeout(drawConnections, 100);
        } else if (type === 'article-modal') {
            const a = articleData[node.dataset.articleId];
            modalTitle.textContent = a.title;
            modalBody.innerHTML = a.content.map(p => `<p>${p}</p>`).join('');
            modal.style.display = 'block';
        }
        // ... 기타 모달 로직 생략 ...
    });

    closeBtn.onclick = () => modal.style.display = 'none';
    window.addEventListener('resize', drawConnections);
    wrapper.addEventListener('scroll', drawConnections);
    setTimeout(drawConnections, 100);
});
