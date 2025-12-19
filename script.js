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
    let articleNodes = [];

    const articleData = window.articleData || {};
    const issue1Articles = Object.keys(articleData).filter(id => id !== 'intro_rekisi');

    // 배치 간격
    const HORIZONTAL_OFFSET = 200;
    const AUTHOR_TITLE_OFFSET = 160;
    const VERTICAL_SPACING = 70;

    // 초기화
    const init = () => {
        const isMobile = window.innerWidth <= 600;
        const baseTop = isMobile ? 150 : 80;

        logoNode.style.left = '60px';
        logoNode.style.top = `${baseTop}px`;
        
        introNode.style.left = `${isMobile ? 180 : 280}px`;
        introNode.style.top = `${baseTop + 10}px`;
        
        issue1Node.style.left = '60px';
        issue1Node.style.top = `${baseTop + 150}px`;

        addBtn(introNode, 'intro');
        addBtn(issue1Node, 'toggle');

        issue1Articles.forEach((id) => {
            const data = articleData[id];
            const auth = document.createElement('div');
            auth.className = 'draggable-node node-author';
            auth.dataset.nodeId = data.author;
            auth.textContent = data.author;
            auth.style.display = 'none';
            addBtn(auth, 'author-modal');
            issue1ChildrenContainer.appendChild(auth);
            articleNodes.push(auth);
            
            const tit = document.createElement('div');
            tit.className = 'draggable-node node-title';
            tit.dataset.nodeId = data.title;
            tit.dataset.articleId = id;
            tit.textContent = data.title;
            tit.style.display = 'none';
            addBtn(tit, 'article-modal');
            issue1ChildrenContainer.appendChild(tit);
            articleNodes.push(tit);
        });
    };

    function addBtn(node, type) {
        const btn = document.createElement('div');
        btn.className = 'node-action-btn';
        btn.dataset.actionType = type;
        btn.innerHTML = type === 'toggle' ? 'LIST' : 'VIEW';
        node.appendChild(btn);
    }

    // 드래그 로직 (이벤트 간섭 제거)
    const getC = (e) => e.touches ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };

    const startDrag = (e) => {
        // 버튼 클릭 시 드래그가 시작되지 않도록 철저히 방어
        if (e.target.closest('.node-action-btn')) return;

        const node = e.target.closest('.draggable-node');
        if (!node) return;

        draggedElement = node;
        const c = getC(e);
        const rect = node.getBoundingClientRect();
        offsetX = c.x - rect.left;
        offsetY = c.y - rect.top;
        draggedElement.style.zIndex = 100;
        
        // 데스크탑에서 텍스트 선택 방지용으로만 사용 (모바일은 touch-action: none으로 해결)
        if (e.type === 'mousedown') e.preventDefault();
    };

    const doDrag = (e) => {
        if (!draggedElement) return;
        const c = getC(e);
        draggedElement.style.left = `${c.x - offsetX + wrapper.scrollLeft}px`;
        draggedElement.style.top = `${c.y - offsetY + wrapper.scrollTop}px`;
        draw();
    };

    const stopDrag = () => { if (draggedElement) draggedElement.style.zIndex = 30; draggedElement = null; };

    wrapper.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', stopDrag);
    wrapper.addEventListener('touchstart', startDrag, { passive: true }); // 버튼 클릭을 위해 passive: true
    window.addEventListener('touchmove', doDrag, { passive: false });
    window.addEventListener('touchend', stopDrag);

    // 선 그리기
    const getP = (id) => {
        const el = document.querySelector(`[data-node-id="${id}"]`);
        if (!el || el.style.display === 'none') return null;
        return { x: parseFloat(el.style.left), y: parseFloat(el.style.top), w: el.offsetWidth, h: el.offsetHeight };
    };

    const draw = () => {
        requestAnimationFrame(() => {
            connectionLinesSvg.innerHTML = '';
            connectionLinesSvg.style.width = `${wrapper.scrollWidth}px`;
            connectionLinesSvg.style.height = `${wrapper.scrollHeight}px`;
            const conns = [{ p: 'logo', c: '소개', type: 'logo' }, { p: 'logo', c: '1호', type: 'logo' }];
            if (issue1Node.classList.contains('expanded')) {
                issue1Articles.forEach(id => {
                    const data = articleData[id];
                    conns.push({ p: '1호', c: data.author, type: 'parent' }, { p: data.author, c: data.title, type: 'straight' });
                });
            }
            conns.forEach(conn => {
                const p = getP(conn.p), c = getP(conn.c);
                if (p && c) {
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    if (conn.type === 'straight') path.setAttribute('class', 'line-straight');
                    const sX = p.x + (conn.type === 'logo' ? p.w/2 : p.w), sY = p.y + (conn.type === 'logo' ? p.h : p.h/2);
                    const eX = c.x, eY = c.y + c.h/2;
                    path.setAttribute('d', `M ${sX} ${sY} C ${sX + (conn.type==='logo'?40:80)} ${sY}, ${eX - (conn.type==='logo'?40:80)} ${eY}, ${eX} ${eY}`);
                    connectionLinesSvg.appendChild(path);
                }
            });
        });
    };

    // 클릭 핸들러 (이벤트 위임 최적화)
    wrapper.addEventListener('click', (e) => {
        const btn = e.target.closest('.node-action-btn');
        if (!btn) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const node = btn.closest('.draggable-node');
        const action = btn.dataset.actionType;

        if (action === 'toggle') {
            const exp = node.classList.toggle('expanded');
            articleNodes.forEach((n, i) => {
                if (exp) {
                    n.style.display = 'block';
                    n.style.left = `${parseFloat(node.style.left) + HORIZONTAL_OFFSET + (i % 2 === 1 ? AUTHOR_TITLE_OFFSET : 0)}px`;
                    n.style.top = `${parseFloat(node.style.top) + Math.floor(i/2) * VERTICAL_SPACING}px`;
                } else n.style.display = 'none';
            });
            setTimeout(draw, 50);
        } else if (action === 'intro') {
            const d = articleData['intro_rekisi'];
            show(d.title, "EDITORIAL", null, d.content);
        } else if (action === 'article-modal') {
            const d = articleData[node.dataset.articleId];
            show(d.title, d.author, d.author_intro, d.content);
        } else if (action === 'author-modal') {
            const name = node.dataset.nodeId;
            const d = Object.values(articleData).find(a => a.author === name);
            show(`AUTHOR: ${name}`, null, d ? d.author_intro : "BIOGRAPHY NOT FOUND.", []);
        }
    });

    const show = (t, m, i, b) => {
        modalTitle.textContent = t;
        modalMeta.textContent = m || "";
        modalAuthorIntro.innerHTML = i ? `<strong>ABOUT AUTHOR:</strong> ${i}` : "";
        modalAuthorIntro.style.display = i ? "block" : "none";
        modalBody.innerHTML = b.map(p => `<p>${p}</p>`).join('');
        modal.style.display = 'block';
    };

    closeBtn.onclick = () => modal.style.display = 'none';

    init();
    window.addEventListener('resize', draw);
    wrapper.addEventListener('scroll', draw);
    setTimeout(draw, 500);
});
