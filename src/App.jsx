import { useCallback, useEffect, useState } from 'react';
import { apiUrl, changePassword, create, createUser, currentUser, hasApi, list, listUsers, login, logout, remove, removeUser, token, update, upload } from './api.js';

const modules = [
  ['solution-groups', '方案分组'], ['solutions', '解决方案'], ['news-categories', '新闻分类'], ['news', '新闻'],
  ['cases', '案例'], ['help-categories', '帮助分类'], ['help', '帮助文章'], ['leads', '合作线索'], ['tickets', '技术工单'], ['users', '账号管理'],
];
const navSections = [
  ['内容规划', ['solution-groups', 'solutions', 'news-categories', 'news', 'cases', 'help-categories', 'help']],
  ['项目跟进', ['leads', 'tickets']],
  ['系统设置', ['users']],
];
const navIcons = { 'solution-groups': '▤', solutions: '◈', 'news-categories': '⌘', news: '◫', cases: '▧', 'help-categories': '?', help: '◌', leads: '↳', tickets: '!', users: '◉' };
const empty = { name: '', title: '', slug: '', category: '', group_id: '', icon: '', cover_image: '', summary: '', body: '', sort_order: 0, published: false, featured: false, detail: {} };
const categoryModules = new Set(['news-categories', 'help-categories']);
const pathFor = (module) => ({ 'news-categories': 'categories/news/items', 'help-categories': 'categories/help/items' }[module] ?? module);
const isSubmission = (module) => module === 'leads' || module === 'tickets';

function Notice({ children, error = false }) { return children ? <p className={error ? 'notice error' : 'notice'}>{children}</p> : null; }

function Login({ onSuccess }) {
  const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (event) => { event.preventDefault(); setBusy(true); setMessage(''); try { await login(username, password); onSuccess(); } catch (error) { setMessage(error.message); } finally { setBusy(false); } };
  return <main className="login-shell"><form className="login-card" onSubmit={submit}><span className="brand-mark">N</span><p>NEXA / CONTENT OPERATIONS</p><h1>运营后台登录</h1><label>用户名<input required value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username"/></label><label>密码<input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"/></label><button disabled={busy}>{busy ? '正在登录…' : '登录'}</button><Notice error>{message}</Notice></form></main>;
}

function ImageUpload({ onUploaded }) {
  const [message, setMessage] = useState('');
  const change = async (event) => { const file = event.target.files?.[0]; if (!file) return; setMessage('正在上传…'); try { const result = await upload(file); onUploaded(apiUrl(result.url)); setMessage('图片上传完成。'); } catch (error) { setMessage(error.message); } finally { event.target.value = ''; } };
  return <div className="upload"><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={change}/><small>JPG、PNG、WebP、GIF，最大 10MB。</small><Notice error={message.includes('失败') || message.includes('仅支持')}>{message}</Notice></div>;
}

function Editor({ active, item, groups, creating, onSave, onDelete }) {
  const [value, setValue] = useState(empty); const [message, setMessage] = useState('');
  useEffect(() => setValue(item ? { ...empty, ...item, detail: item.detail ?? {} } : empty), [item]);
  const set = (key, next) => setValue((current) => ({ ...current, [key]: next }));
  const category = categoryModules.has(active); const group = active === 'solution-groups'; const solution = active === 'solutions';
  if (!item && !creating) return <section className="editor empty-state"><div className="empty-icon">↙</div><h2>选择一条记录开始编辑</h2><p>从左侧清单选择内容，或点击右上角“新建”创建一条记录。</p></section>;
  const submit = async (event) => { event.preventDefault(); try { const detail = typeof value.detail === 'string' ? JSON.parse(value.detail || '{}') : value.detail; await onSave({ ...value, group_id: Number(value.group_id), sort_order: Number(value.sort_order), detail }); setMessage('保存成功。'); } catch (error) { setMessage(error instanceof SyntaxError ? '详情 JSON 格式不正确。' : error.message); } };
  return <form className="editor" onSubmit={submit}><div className="editor-title"><div><p>{item ? 'EDIT' : 'CREATE'}</p><h2>{item ? '编辑' : '新建'}{group ? '方案分组' : category ? '分类' : solution ? '解决方案' : '内容'}</h2></div>{item && <button className="danger" type="button" onClick={() => onDelete(item.id)}>删除</button>}</div><div className="form-grid">
    {solution && <label>所属分组<select required value={value.group_id} onChange={(e) => set('group_id', e.target.value)}><option value="">请选择</option>{groups.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>}
    {!group && !category && <label>标题<input required value={solution ? value.name : value.title} onChange={(e) => set(solution ? 'name' : 'title', e.target.value)}/></label>}
    <label>{group || category ? '名称' : 'Slug'}<input required value={group || category ? value.name : value.slug} pattern={group ? undefined : '[a-z0-9-]+'} onChange={(e) => set(group || category ? 'name' : 'slug', e.target.value)}/></label>
    {!group && <label>{category ? 'Slug' : '分类'}<input required value={category ? value.slug : value.category ?? ''} pattern={category ? '[a-z0-9-]+' : undefined} onChange={(e) => set(category ? 'slug' : 'category', e.target.value)}/></label>}
    {solution && <><label>图标<input value={value.icon} onChange={(e) => set('icon', e.target.value)}/></label><label>封面图 URL<input value={value.cover_image} onChange={(e) => set('cover_image', e.target.value)}/></label><label>上传封面图<ImageUpload onUploaded={(url) => set('cover_image', url)}/></label></>}
    <label>排序<input type="number" value={value.sort_order} onChange={(e) => set('sort_order', e.target.value)}/></label>
    {!group && !category && <label className="wide">摘要<textarea value={value.summary} onChange={(e) => set('summary', e.target.value)} rows="3"/></label>}
    {!group && !category && !solution && <label className="wide">正文<textarea value={value.body} onChange={(e) => set('body', e.target.value)} rows="10"/></label>}
    {solution && <label className="wide">详情 JSON<textarea className="code" value={typeof value.detail === 'string' ? value.detail : JSON.stringify(value.detail, null, 2)} onChange={(e) => set('detail', e.target.value)} rows="11"/></label>}
  </div><div className="checks"><label><input type="checkbox" checked={Boolean(value.published)} onChange={(e) => set('published', e.target.checked)}/> 已发布</label>{!group && !category && <label><input type="checkbox" checked={Boolean(value.featured)} onChange={(e) => set('featured', e.target.checked)}/> 首页精选/热门</label>}</div><button className="primary">保存</button><Notice error={message.includes('失败') || message.includes('不正确')}>{message}</Notice></form>;
}

function Submission({ active, item, onSave }) {
  const [value, setValue] = useState({ workflow_status: '待处理', assignee: '', notes: '' }); const [message, setMessage] = useState('');
  useEffect(() => setValue({ workflow_status: item?.workflow_status || '待处理', assignee: item?.assignee || '', notes: item?.notes || '' }), [item]);
  if (!item) return <section className="editor empty">从左侧选择一条提交记录。</section>;
  const submit = async (event) => { event.preventDefault(); try { await onSave(item.id, value); setMessage('处理状态已更新。'); } catch (error) { setMessage(error.message); } };
  return <form className="editor" onSubmit={submit}><div className="editor-title"><div><p>{active.toUpperCase()}</p><h2>{item.company} · {item.name}</h2></div><span className="status">{item.workflow_status || '待处理'}</span></div><p className="description">{item.description}</p><p className="metadata">{item.contact} · {item.type}{item.level ? ` · ${item.level}` : ''} · {item.created_at}</p><div className="form-grid"><label>状态<select value={value.workflow_status} onChange={(e) => setValue({ ...value, workflow_status: e.target.value })}>{['待处理', '处理中', '已完成'].map((status) => <option key={status}>{status}</option>)}</select></label><label>负责人<input value={value.assignee} onChange={(e) => setValue({ ...value, assignee: e.target.value })}/></label><label className="wide">内部备注<textarea rows="7" value={value.notes} onChange={(e) => setValue({ ...value, notes: e.target.value })}/></label></div><button className="primary">保存处理状态</button><Notice>{message}</Notice></form>;
}

function UserManagement() {
  const [users, setUsers] = useState([]); const [message, setMessage] = useState(''); const [selected, setSelected] = useState('');
  const [newUser, setNewUser] = useState({ username: '', password: '' }); const [passwords, setPasswords] = useState({ current_password: '', new_password: '' });
  const me = currentUser();
  const loadUsers = useCallback(async () => { try { const next = await listUsers(); setUsers(next); setSelected((current) => current || next[0]?.username || ''); } catch (error) { setMessage(error.message); } }, []);
  useEffect(() => { loadUsers(); }, [loadUsers]);
  const addUser = async (event) => { event.preventDefault(); setMessage(''); try { await createUser(newUser); setNewUser({ username: '', password: '' }); setMessage('账号已创建。'); await loadUsers(); } catch (error) { setMessage(error.message); } };
  const updatePassword = async (event) => { event.preventDefault(); setMessage(''); try { await changePassword(selected, passwords); setPasswords({ current_password: '', new_password: '' }); setMessage(selected === me ? '密码已修改，请使用新密码重新登录。' : '密码已重置。'); } catch (error) { setMessage(error.message); } };
  const deleteUser = async (username) => { if (!confirm(`确定删除账号“${username}”吗？`)) return; setMessage(''); try { await removeUser(username); setSelected(''); setMessage('账号已删除。'); await loadUsers(); } catch (error) { setMessage(error.message); } };
  const selectedIsMe = selected === me;
  return <div className="users-workspace"><section className="list user-list"><div className="list-heading">现有账号</div>{users.map((entry) => <button className={selected === entry.username ? 'selected' : ''} key={entry.id} onClick={() => { setSelected(entry.username); setPasswords({ current_password: '', new_password: '' }); }}><b>{entry.username}</b><span>{entry.username === me ? '当前账号' : '管理员'}</span></button>)}{!users.length && <p>暂无账号。</p>}</section><section className="user-panels"><form className="editor" onSubmit={addUser}><div className="editor-title"><div><p>CREATE ACCOUNT</p><h2>创建新账号</h2></div></div><div className="form-grid"><label>用户名<input required minLength="3" pattern="[a-zA-Z0-9_.-]+" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}/></label><label>初始密码<input required type="password" minLength="12" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}/></label></div><p className="hint">用户名可使用字母、数字、点、下划线和连字符；密码至少 12 位。</p><button className="primary">创建账号</button></form><form className="editor" onSubmit={updatePassword}><div className="editor-title"><div><p>PASSWORD</p><h2>{selected ? `${selectedIsMe ? '修改我的密码' : `重置 ${selected} 的密码`}` : '选择一个账号'}</h2></div>{selected && !selectedIsMe && <button className="danger" type="button" onClick={() => deleteUser(selected)}>删除账号</button>}</div>{selected ? <><div className="form-grid">{selectedIsMe && <label>当前密码<input required type="password" value={passwords.current_password} onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}/></label>}<label className={selectedIsMe ? '' : 'wide'}>新密码<input required type="password" minLength="12" value={passwords.new_password} onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}/></label></div><button className="primary">{selectedIsMe ? '修改密码' : '重置密码'}</button></> : <p className="empty">请从左侧选择账号。</p>}<Notice error={Boolean(message) && !message.includes('已')}>{message}</Notice></form></section></div>;
}

export default function App() {
  const [active, setActive] = useState('solutions'); const [items, setItems] = useState([]); const [groups, setGroups] = useState([]); const [selected, setSelected] = useState(null); const [creating, setCreating] = useState(false); const [detailOpen, setDetailOpen] = useState(false); const [query, setQuery] = useState(''); const [collapsed, setCollapsed] = useState(false); const [loggedIn, setLoggedIn] = useState(Boolean(token())); const [message, setMessage] = useState('');
  const load = useCallback(async () => { if (!loggedIn || active === 'users') return; setMessage('正在读取…'); try { const [nextItems, nextGroups] = await Promise.all([list(pathFor(active)), active === 'solutions' ? list('solution-groups') : Promise.resolve([])]); setItems(nextItems); setGroups(nextGroups); setMessage(''); } catch (error) { if (error.message.includes('登录') || error.message.includes('令牌')) { logout(); setLoggedIn(false); } setMessage(error.message); } }, [active, loggedIn]);
  useEffect(() => { setSelected(null); setCreating(false); setDetailOpen(false); setQuery(''); load(); }, [load]);
  if (!hasApi) return <main className="login-shell"><section className="login-card"><h1>缺少 API 配置</h1><p>复制 <code>.env.example</code> 为 <code>.env</code> 并设置 <code>VITE_API_BASE_URL</code>。</p></section></main>;
  if (!loggedIn) return <Login onSuccess={() => setLoggedIn(true)}/>;
  const save = async (value) => { const path = pathFor(active); if (selected) await update(`${path}/${selected.id}`, value); else await create(path, value); setCreating(false); await load(); };
  const deleteItem = async (id) => { if (!confirm('确定删除此项吗？')) return; await remove(`${pathFor(active)}/${id}`); setSelected(null); await load(); };
  const workflow = async (id, value) => { await update(`${active}/${id}/workflow`, value); await load(); };
  const title = modules.find(([key]) => key === active)?.[1]; const filteredItems = items.filter((item) => `${item.name ?? ''} ${item.title ?? ''} ${item.company ?? ''} ${item.category ?? ''}`.toLowerCase().includes(query.toLowerCase()));
  const detailTitle = creating ? `新建${title}` : selected?.name ?? selected?.title ?? selected?.company ?? title;
  return <main className={`app ${collapsed ? 'rail-collapsed' : ''}`}><aside><div className="brand-row"><a className="logo" href="#/"><span className="logo-glyph">N</span><span className="brand-copy"><b>NEXA</b><small>内容运营中心</small></span></a><button className="rail-toggle" aria-label={collapsed ? '展开菜单' : '收起菜单'} title={collapsed ? '展开菜单' : '收起菜单'} onClick={() => setCollapsed((value) => !value)}>{collapsed ? '›' : '‹'}</button></div><nav>{navSections.map(([section, keys]) => <section className="nav-section" key={section}><p>{section}</p>{keys.map((key) => { const label = modules.find(([module]) => module === key)?.[1]; return <button className={active === key ? 'active' : ''} key={key} title={collapsed ? label : undefined} onClick={() => setActive(key)}><i>{navIcons[key]}</i><span>{label}</span></button>; })}</section>)}</nav></aside><section className="content-shell"><div className="admin-header"><span className="header-brand">NEXA 内容运营中心</span><div className="header-account"><span>当前账号</span><b>{currentUser() || '管理员'}</b></div><button className="header-logout" onClick={() => { logout(); setLoggedIn(false); }}>退出登录</button></div><section className="main">{active === 'users' ? <><header><div><p className="breadcrumb">系统设置 / 账号管理</p><h1>账号管理</h1></div></header><UserManagement/></> : detailOpen ? <><header className="detail-header"><div><button className="back-button" onClick={() => { setDetailOpen(false); setCreating(false); }}>← 返回{title}</button><p className="breadcrumb">内容运营 / {title}</p><h1>{detailTitle}</h1></div></header>{isSubmission(active) ? <Submission active={active} item={selected} onSave={workflow}/> : <Editor active={active} item={selected} creating={creating} groups={groups} onSave={save} onDelete={deleteItem}/>}</> : <><header><div><p className="breadcrumb">内容运营 / {title}</p><h1>{title}</h1></div>{!isSubmission(active) && <button className="primary new" onClick={() => { setSelected(null); setCreating(true); setDetailOpen(true); }}>新建{title}</button>}</header><Notice error={message && message !== '正在读取…'}>{message}</Notice><section className="records-page"><div className="records-toolbar"><div><b>{isSubmission(active) ? '待处理队列' : `${title}列表`}</b><span>{items.length} 条记录</span></div><input aria-label="搜索当前清单" placeholder="搜索标题、分类…" value={query} onChange={(event) => setQuery(event.target.value)}/></div><div className="records-table">{filteredItems.map((item) => <button key={item.id} onClick={() => { setSelected(item); setCreating(false); setDetailOpen(true); }}><span><b>{item.name ?? item.title ?? item.company}</b><small>{item.summary ?? item.description ?? item.contact ?? '—'}</small></span><em>{item.workflow_status ?? (item.published === false ? '草稿' : item.category ?? '已发布')}</em><i>查看 ›</i></button>)}{!filteredItems.length && !message && <p className="empty">{query ? '没有匹配的记录。' : '还没有记录。'}</p>}</div></section></>}</section></section></main>;
}
