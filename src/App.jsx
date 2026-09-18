import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Checkbox, Form, Image, Input, InputNumber, Select, Switch, Upload } from 'antd';
import { CheckCircleFilled, DeleteOutlined, DownOutlined, PictureOutlined, PlusOutlined, UploadOutlined, UpOutlined } from '@ant-design/icons';
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
const defaultArchitecture = () => ({ title: '系统架构', layers: [
  { name: '业务应用', items: ['运营中心', '移动应用', '管理驾驶舱'] },
  { name: '平台服务', items: ['设备管理', '规则引擎', '数据服务', '工单'] },
  { name: '边缘连接', items: ['协议接入', '本地联动', '边缘计算'] },
  { name: '现场设备', items: ['传感器', '控制器', '网关', '业务设备'] },
] });
const solutionDetailKeys = ['hero', 'capabilities', 'architecture', 'advantages', 'scenarios', 'flow', 'faq', 'cta'];
const detailFromItem = (item) => item?.detail ?? Object.fromEntries(solutionDetailKeys.filter((key) => key in (item || {})).map((key) => [key, item[key]]));
const empty = { name: '', title: '', slug: '', category: '', group_id: '', icon: '', cover_image: '', image_url: '', summary: '', body: '', published_at: '', sort_order: 0, published: false, featured: false, detail: {} };
const newSolution = () => ({ ...empty, detail: { architecture: defaultArchitecture() } });
const categoryModules = new Set(['news-categories', 'help-categories']);
const pathFor = (module) => ({ 'news-categories': 'categories/news/items', 'help-categories': 'categories/help/items' }[module] ?? module);
const isSubmission = (module) => module === 'leads' || module === 'tickets';

function Notice({ children, error = false }) { return children ? <p className={error ? 'notice error' : 'notice'}>{children}</p> : null; }
const toDateTimeLocal = (value) => value ? String(value).replace(' ', 'T').slice(0, 16) : '';

function Login({ onSuccess }) {
  const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (event) => { event.preventDefault(); setBusy(true); setMessage(''); try { await login(username, password); onSuccess(); } catch (error) { setMessage(error.message); } finally { setBusy(false); } };
  return <main className="login-shell"><form className="login-card" onSubmit={submit}><span className="brand-mark">N</span><p>NEXA / CONTENT OPERATIONS</p><h1>运营后台登录</h1><label>用户名<input required value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username"/></label><label>密码<input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"/></label><button disabled={busy}>{busy ? '正在登录…' : '登录'}</button><Notice error>{message}</Notice></form></main>;
}

function ImageUpload({ onUploaded, value }) {
  const [message, setMessage] = useState(''); const [fileName, setFileName] = useState('');
  const uploadFile = async (file) => {
    setMessage('正在上传…');
    try { const result = await upload(file); onUploaded(apiUrl(result.url)); setFileName(file.name); setMessage('上传完成，已更新封面地址。'); }
    catch (error) { setMessage(error.message); }
    return Upload.LIST_IGNORE;
  };
  return <div className="image-upload"><Upload.Dragger className="upload-dropzone" accept="image/jpeg,image/png,image/webp,image/gif" maxCount={1} showUploadList={false} beforeUpload={uploadFile}><div className="upload-dropzone-content"><span className="upload-art"><PictureOutlined /></span><div className="upload-copy"><b>{fileName || '点击上传或将图片拖到这里'}</b><small>JPG、PNG、WebP、GIF · 最大 10MB</small></div><Button icon={<UploadOutlined />}>选择图片</Button></div></Upload.Dragger>{value && <div className="upload-current"><Image className="cover-thumbnail" width={112} height={72} style={{ width: 112, height: 72, objectFit: 'cover' }} src={value} alt="当前封面图" preview={{ mask: '点击放大预览' }}/><div><span><CheckCircleFilled /> 当前封面图</span><small>点击缩略图可放大预览</small></div></div>}<Notice error={message.includes('失败') || message.includes('仅支持')}>{message}</Notice></div>;
}

function RichTextEditor({ value, onChange }) {
  const editor = useRef(null);
  useEffect(() => { if (editor.current && editor.current.innerHTML !== value) editor.current.innerHTML = value || ''; }, [value]);
  const command = (name, commandValue = null) => { editor.current?.focus(); document.execCommand(name, false, commandValue); onChange(editor.current?.innerHTML || ''); };
  const addLink = () => { const url = window.prompt('请输入链接地址'); if (url) command('createLink', url); };
  const addImage = () => { const url = window.prompt('请输入图片地址'); if (url) command('insertImage', url); };
  return <div className="rich-editor"><div className="rich-editor-toolbar" role="toolbar" aria-label="新闻正文格式工具"><button type="button" title="加粗" onMouseDown={(event) => event.preventDefault()} onClick={() => command('bold')}><b>B</b></button><button type="button" title="斜体" onMouseDown={(event) => event.preventDefault()} onClick={() => command('italic')}><i>I</i></button><button type="button" title="二级标题" onMouseDown={(event) => event.preventDefault()} onClick={() => command('formatBlock', 'h2')}>H2</button><button type="button" title="三级标题" onMouseDown={(event) => event.preventDefault()} onClick={() => command('formatBlock', 'h3')}>H3</button><span/><button type="button" title="无序列表" onMouseDown={(event) => event.preventDefault()} onClick={() => command('insertUnorderedList')}>• 列表</button><button type="button" title="有序列表" onMouseDown={(event) => event.preventDefault()} onClick={() => command('insertOrderedList')}>1. 列表</button><button type="button" title="引用" onMouseDown={(event) => event.preventDefault()} onClick={() => command('formatBlock', 'blockquote')}>引用</button><span/><button type="button" title="插入链接" onMouseDown={(event) => event.preventDefault()} onClick={addLink}>链接</button><button type="button" title="插入图片" onMouseDown={(event) => event.preventDefault()} onClick={addImage}>图片</button></div><div ref={editor} className="rich-editor-content" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" data-placeholder="输入新闻正文，支持标题、列表、引用、链接和图片。" onInput={(event) => onChange(event.currentTarget.innerHTML)}/><small>正文将以 HTML 富文本保存，并在前台新闻详情页按排版展示。</small></div>;
}

const emptyArchitecture = { title: '系统架构', layers: [] };
const detailFromValue = (detail) => {
  try { return typeof detail === 'string' ? JSON.parse(detail || '{}') : detail || {}; } catch { return {}; }
};
const architectureFromDetail = (detail) => {
  try {
    const parsed = detailFromValue(detail);
    const architecture = parsed.architecture || emptyArchitecture;
    return { title: architecture.title || '系统架构', layers: Array.isArray(architecture.layers) ? architecture.layers : [] };
  } catch { return emptyArchitecture; }
};

function ArchitectureEditor({ detail, onChange }) {
  const architecture = architectureFromDetail(detail);
  const update = (next) => {
    const parsed = detailFromValue(detail);
    onChange({ ...parsed, architecture: next });
  };
  const updateLayer = (index, nextLayer) => update({ ...architecture, layers: architecture.layers.map((layer, i) => i === index ? nextLayer : layer) });
  const move = (items, from, to) => items.map((item, index) => index === from ? items[to] : index === to ? items[from] : item);
  const moveLayer = (from, to) => update({ ...architecture, layers: move(architecture.layers, from, to) });
  const removeLayer = (index) => update({ ...architecture, layers: architecture.layers.filter((_, i) => i !== index) });
  const addLayer = () => update({ ...architecture, layers: [...architecture.layers, { name: '', items: [] }] });
  const [draggedLayer, setDraggedLayer] = useState(null);
  return <section className="architecture-editor wide" aria-labelledby="architecture-editor-title">
    <div className="architecture-editor-head"><div><span id="architecture-editor-title">系统架构</span><small>先建立大类，再在其下添加小类；可拖动排序。</small></div><Button icon={<PlusOutlined/>} onClick={addLayer}>新建大类</Button></div>
    <Form.Item label="架构标题"><Input value={architecture.title} onChange={(event) => update({ ...architecture, title: event.target.value })}/></Form.Item>
    <div className="architecture-tree">
      {architecture.layers.map((layer, layerIndex) => <div className="architecture-node" key={layerIndex} draggable onDragStart={() => setDraggedLayer(layerIndex)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedLayer !== null && draggedLayer !== layerIndex) moveLayer(draggedLayer, layerIndex); setDraggedLayer(null); }}>
        <div className="architecture-layer-row"><span className="drag-handle" title="拖动调整大类顺序">⋮⋮</span><Input aria-label={`大类 ${layerIndex + 1}`} placeholder="请输入大类名称" value={layer.name} onChange={(event) => updateLayer(layerIndex, { ...layer, name: event.target.value })}/><Button type="text" icon={<UpOutlined/>} disabled={layerIndex === 0} onClick={() => moveLayer(layerIndex, layerIndex - 1)} aria-label="上移大类"/><Button type="text" icon={<DownOutlined/>} disabled={layerIndex === architecture.layers.length - 1} onClick={() => moveLayer(layerIndex, layerIndex + 1)} aria-label="下移大类"/><Button type="text" danger icon={<DeleteOutlined/>} onClick={() => removeLayer(layerIndex)} aria-label="删除大类"/></div>
        <div className="architecture-children">
          {(layer.items || []).map((item, itemIndex) => <ArchitectureChild key={itemIndex} item={item} itemIndex={itemIndex} items={layer.items || []} onChange={(items) => updateLayer(layerIndex, { ...layer, items })}/>) }
          <Button type="dashed" size="small" icon={<PlusOutlined/>} onClick={() => updateLayer(layerIndex, { ...layer, items: [...(layer.items || []), ''] })}>新建小类</Button>
        </div>
      </div>)}
      {!architecture.layers.length && <p className="architecture-empty">暂无架构大类。点击“新建大类”开始配置。</p>}
    </div>
  </section>;
}

function ArchitectureChild({ item, itemIndex, items, onChange }) {
  const move = (from, to) => onChange(items.map((entry, index) => index === from ? items[to] : index === to ? items[from] : entry));
  return <div className="architecture-child" draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', String(itemIndex))} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const dragged = Number(event.dataTransfer.getData('text/plain')); if (Number.isInteger(dragged) && dragged !== itemIndex) move(dragged, itemIndex); }}><span className="drag-handle" title="拖动调整小类顺序">⋮⋮</span><Input aria-label={`小类 ${itemIndex + 1}`} placeholder="请输入小类名称" size="small" value={item} onChange={(event) => onChange(items.map((entry, index) => index === itemIndex ? event.target.value : entry))}/><Button type="text" size="small" icon={<UpOutlined/>} disabled={itemIndex === 0} onClick={() => move(itemIndex, itemIndex - 1)} aria-label="上移小类"/><Button type="text" size="small" icon={<DownOutlined/>} disabled={itemIndex === items.length - 1} onClick={() => move(itemIndex, itemIndex + 1)} aria-label="下移小类"/><Button type="text" size="small" danger icon={<DeleteOutlined/>} onClick={() => onChange(items.filter((_, index) => index !== itemIndex))} aria-label="删除小类"/></div>;
}

function FaqEditor({ detail, onChange }) {
  const parsed = detailFromValue(detail);
  const faq = Array.isArray(parsed.faq) ? parsed.faq : [];
  const update = (next) => onChange({ ...parsed, faq: next });
  const setItem = (index, key, value) => update(faq.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  const move = (from, to) => update(faq.map((item, index) => index === from ? faq[to] : index === to ? faq[from] : item));
  return <section className="faq-editor wide" aria-labelledby="faq-editor-title"><div className="faq-editor-head"><div><span id="faq-editor-title">常见问题</span><small>可新增多条；每条问题和答案均为必填。</small></div><Button icon={<PlusOutlined/>} onClick={() => update([...faq, { q: '', a: '' }])}>新建问题</Button></div><div className="faq-editor-list">{faq.map((item, index) => <article className="faq-editor-item" key={index}><div className="faq-editor-item-head"><b>问题 {index + 1}</b><span><Button type="text" size="small" icon={<UpOutlined/>} disabled={index === 0} onClick={() => move(index, index - 1)} aria-label="上移问题"/><Button type="text" size="small" icon={<DownOutlined/>} disabled={index === faq.length - 1} onClick={() => move(index, index + 1)} aria-label="下移问题"/><Button type="text" size="small" danger icon={<DeleteOutlined/>} onClick={() => update(faq.filter((_, itemIndex) => itemIndex !== index))} aria-label="删除问题"/></span></div><Form.Item label="问题" required><Input value={item.q ?? ''} onChange={(event) => setItem(index, 'q', event.target.value)} placeholder="请输入问题"/></Form.Item><Form.Item label="答案" required><Input.TextArea value={item.a ?? ''} onChange={(event) => setItem(index, 'a', event.target.value)} placeholder="请输入答案" rows={3}/></Form.Item></article>)}</div>{!faq.length && <p className="faq-editor-empty">暂无问题；如需在前台展示 FAQ，请新建问题。</p>}</section>;
}

const invalidFaq = (detail) => Array.isArray(detail?.faq) && detail.faq.some((item) => !String(item?.q || '').trim() || !String(item?.a || '').trim());

function Editor({ active, item, groups, newsCategories, creating, onSave, onDelete }) {
  const [value, setValue] = useState(empty); const [message, setMessage] = useState('');
  useEffect(() => setValue(item ? { ...empty, ...item, published_at: toDateTimeLocal(item.published_at), detail: detailFromItem(item) } : creating && active === 'solutions' ? newSolution() : creating && active === 'news' ? { ...empty, published_at: toDateTimeLocal(new Date().toISOString()) } : empty), [active, creating, item]);
  const set = (key, next) => setValue((current) => ({ ...current, [key]: next }));
  const category = categoryModules.has(active); const group = active === 'solution-groups'; const solution = active === 'solutions'; const mediaItem = active === 'cases' || active === 'news';
  if (!item && !creating) return <section className="editor empty-state"><div className="empty-icon">↙</div><h2>选择一条记录开始编辑</h2><p>从左侧清单选择内容，或点击右上角“新建”创建一条记录。</p></section>;
  const submit = async () => { try { const detail = typeof value.detail === 'string' ? JSON.parse(value.detail || '{}') : value.detail; if (solution && invalidFaq(detail)) throw new Error('每条常见问题的问题和答案都不能为空。'); await onSave({ ...value, group_id: Number(value.group_id), sort_order: Number(value.sort_order), detail }); setMessage('保存成功。'); } catch (error) { setMessage(error instanceof SyntaxError ? '详情 JSON 格式不正确。' : error.message); } };
  return <Form className="editor antd-editor" layout="vertical" requiredMark onFinish={submit}><div className="editor-title"><div><p>{item ? '编辑记录' : '创建记录'}</p><h2>{item ? '编辑' : '新建'}{group ? '方案分组' : category ? '分类' : solution ? '解决方案' : '内容'}</h2></div>{item && <Button className="danger" danger type="text" onClick={() => onDelete(item.id)}>删除</Button>}</div><div className={`form-grid ${solution ? 'solution-form' : ''}`}>
    {solution && <div className="form-section-title wide"><span>基础信息</span><small>填写前台列表和详情页展示所需的信息。</small></div>}
    {solution && <Form.Item label="所属分组" required><Select placeholder="请选择方案分组" value={value.group_id || undefined} options={groups.map((entry) => ({ value: entry.id, label: entry.name }))} onChange={(next) => set('group_id', next)}/></Form.Item>}
    {!group && !category && <Form.Item label="标题" required><Input value={solution ? value.name : value.title} onChange={(e) => set(solution ? 'name' : 'title', e.target.value)}/></Form.Item>}
    <Form.Item label={group || category ? '名称' : 'Slug'} required><Input value={group || category ? value.name : value.slug} onChange={(e) => set(group || category ? 'name' : 'slug', e.target.value)}/></Form.Item>
    {active === 'news' ? <Form.Item label="新闻分类" required rules={[{ required: true, message: '请选择新闻分类' }]}><Select placeholder="请选择新闻分类" value={value.category || undefined} options={newsCategories.map((entry) => ({ value: entry.name, label: entry.published ? entry.name : `${entry.name}（未发布）` }))} onChange={(next) => set('category', next)}/></Form.Item> : !group && !solution && <Form.Item label={category ? 'Slug' : '分类'} required><Input value={category ? value.slug : value.category ?? ''} onChange={(e) => set(category ? 'slug' : 'category', e.target.value)}/></Form.Item>}
    {solution && <><div className="form-section-title wide"><span>展示素材</span><small>上传封面图后会自动用于前台展示；图标可留空。</small></div><Form.Item label="图标"><Input placeholder="例如：楼、能、AI" value={value.icon} onChange={(e) => set('icon', e.target.value)}/></Form.Item><Form.Item className="wide" label="上传封面图"><ImageUpload value={value.cover_image} onUploaded={(url) => set('cover_image', url)}/></Form.Item></>}
    {mediaItem && <><div className="form-section-title wide case-image-section-title"><span>{active === 'news' ? '新闻图片' : '首页案例图片'}</span><small>{active === 'news' ? '此图片会显示在前台新闻中心的最新动态与专题栏目中。' : '此图片会显示在前台首页「项目现场与行业实践」卡片中。'}</small></div><Form.Item className="wide" label={active === 'news' ? '新闻图片地址' : '案例图片地址'}><Input placeholder="粘贴图片 URL，或通过下方上传自动填入" value={value.image_url || ''} onChange={(e) => set('image_url', e.target.value)}/></Form.Item><Form.Item className="wide" label={active === 'news' ? '上传新闻图片' : '上传案例图片'}><ImageUpload value={value.image_url} onUploaded={(url) => set('image_url', url)}/></Form.Item></>}
    <Form.Item label="排序"><InputNumber min={0} value={Number(value.sort_order)} onChange={(next) => set('sort_order', next ?? 0)}/></Form.Item>
    {active === 'news' && <Form.Item label="发布时间" required><Input required type="datetime-local" value={toDateTimeLocal(value.published_at)} onChange={(event) => set('published_at', event.target.value)}/></Form.Item>}
    {!group && !category && <Form.Item className="wide" label="摘要"><Input.TextArea value={value.summary} onChange={(e) => set('summary', e.target.value)} rows={3}/></Form.Item>}
    {!group && !category && !solution && <Form.Item className="wide" label="正文">{active === 'news' ? <RichTextEditor value={value.body} onChange={(next) => set('body', next)}/> : <Input.TextArea value={value.body} onChange={(e) => set('body', e.target.value)} rows={10}/>}</Form.Item>}
    {solution && <ArchitectureEditor detail={value.detail} onChange={(next) => set('detail', next)}/>} 
    {solution && <FaqEditor detail={value.detail} onChange={(next) => set('detail', next)}/>} 
    {solution && <details className="advanced wide"><summary>高级配置：详情 JSON</summary><p>系统架构和常见问题已可在上方直接配置；这里保留用于调整其他详情模块。留空会自动生成默认内容。</p><Input.TextArea className="code" aria-label="详情 JSON" value={typeof value.detail === 'string' ? value.detail : JSON.stringify(value.detail, null, 2)} onChange={(e) => set('detail', e.target.value)} rows={11}/></details>}
  </div><div className="checks"><Switch checked={Boolean(value.published)} onChange={(next) => set('published', next)}/><span>已发布</span>{!group && !category && <Checkbox checked={Boolean(value.featured)} onChange={(e) => set('featured', e.target.checked)}>首页精选/热门</Checkbox>}</div><Button className="primary" type="primary" htmlType="submit">保存</Button><Notice error={message.includes('失败') || message.includes('不正确')}>{message}</Notice></Form>;
}

function Submission({ active, item, onSave }) {
  const [value, setValue] = useState({ workflow_status: '待处理', assignee: '', notes: '' }); const [message, setMessage] = useState('');
  useEffect(() => setValue({ workflow_status: item?.workflow_status || '待处理', assignee: item?.assignee || '', notes: item?.notes || '' }), [item]);
  if (!item) return <section className="editor empty">从左侧选择一条提交记录。</section>;
  const submit = async (event) => { event.preventDefault(); try { await onSave(item.id, value); setMessage('处理状态已更新。'); } catch (error) { setMessage(error.message); } };
  return <form className="editor antd-editor" onSubmit={submit}><div className="editor-title"><div><p>{active.toUpperCase()}</p><h2>{item.company} · {item.name}</h2></div><span className="status">{item.workflow_status || '待处理'}</span></div><p className="description">{item.description}</p><p className="metadata">{item.contact} · {item.type}{item.level ? ` · ${item.level}` : ''} · {item.created_at}</p><div className="form-grid"><label>状态<Select value={value.workflow_status} options={['待处理', '处理中', '已完成'].map((status) => ({ value: status, label: status }))} onChange={(next) => setValue({ ...value, workflow_status: next })}/></label><label>负责人<input value={value.assignee} onChange={(e) => setValue({ ...value, assignee: e.target.value })}/></label><label className="wide">内部备注<textarea rows="7" value={value.notes} onChange={(e) => setValue({ ...value, notes: e.target.value })}/></label></div><button className="primary">保存处理状态</button><Notice>{message}</Notice></form>;
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
  return <div className="users-workspace"><section className="list user-list"><div className="list-heading">现有账号</div>{users.map((entry) => <div className="user-list-row" key={entry.id}><button className={selected === entry.username ? 'selected' : ''} onClick={() => { setSelected(entry.username); setPasswords({ current_password: '', new_password: '' }); }}><b>{entry.username}</b><span>{entry.username === me ? '当前账号' : '管理员'}</span></button>{entry.username !== me && <button className="list-delete" type="button" onClick={() => deleteUser(entry.username)}>删除</button>}</div>)}{!users.length && <p>暂无账号。</p>}</section><section className="user-panels"><form className="editor" onSubmit={addUser}><div className="editor-title"><div><p>CREATE ACCOUNT</p><h2>创建新账号</h2></div></div><div className="form-grid"><label>用户名<input required minLength="3" pattern="[a-zA-Z0-9_.-]+" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}/></label><label>初始密码<input required type="password" minLength="12" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}/></label></div><p className="hint">用户名可使用字母、数字、点、下划线和连字符；密码至少 12 位。</p><button className="primary">创建账号</button></form><form className="editor" onSubmit={updatePassword}><div className="editor-title"><div><p>PASSWORD</p><h2>{selected ? `${selectedIsMe ? '修改我的密码' : `重置 ${selected} 的密码`}` : '选择一个账号'}</h2></div>{selected && !selectedIsMe && <button className="danger" type="button" onClick={() => deleteUser(selected)}>删除账号</button>}</div>{selected ? <><div className="form-grid">{selectedIsMe && <label>当前密码<input required type="password" value={passwords.current_password} onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}/></label>}<label className={selectedIsMe ? '' : 'wide'}>新密码<input required type="password" minLength="12" value={passwords.new_password} onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}/></label></div><button className="primary">{selectedIsMe ? '修改密码' : '重置密码'}</button></> : <p className="empty">请从左侧选择账号。</p>}<Notice error={Boolean(message) && !message.includes('已')}>{message}</Notice></form></section></div>;
}

export default function App() {
  const [active, setActive] = useState('solutions'); const [items, setItems] = useState([]); const [groups, setGroups] = useState([]); const [newsCategories, setNewsCategories] = useState([]); const [selected, setSelected] = useState(null); const [creating, setCreating] = useState(false); const [detailOpen, setDetailOpen] = useState(false); const [query, setQuery] = useState(''); const [collapsed, setCollapsed] = useState(false); const [loggedIn, setLoggedIn] = useState(Boolean(token())); const [message, setMessage] = useState(''); const [savedMessage, setSavedMessage] = useState('');
  const load = useCallback(async () => { if (!loggedIn || active === 'users') return; setMessage('正在读取…'); try { const [nextItems, nextGroups, nextNewsCategories] = await Promise.all([list(pathFor(active)), active === 'solutions' ? list('solution-groups') : Promise.resolve([]), active === 'news' ? list('categories/news/items') : Promise.resolve([])]); setItems(nextItems); setGroups(nextGroups); setNewsCategories(nextNewsCategories); setMessage(''); } catch (error) { if (error.message.includes('登录') || error.message.includes('令牌')) { logout(); setLoggedIn(false); } setMessage(error.message); } }, [active, loggedIn]);
  useEffect(() => { setSelected(null); setCreating(false); setDetailOpen(false); setQuery(''); setSavedMessage(''); load(); }, [load]);
  if (!hasApi) return <main className="login-shell"><section className="login-card"><h1>缺少 API 配置</h1><p>复制 <code>.env.example</code> 为 <code>.env</code> 并设置 <code>VITE_API_BASE_URL</code>。</p></section></main>;
  if (!loggedIn) return <Login onSuccess={() => setLoggedIn(true)}/>;
  const save = async (value) => { const path = pathFor(active); if (selected) await update(`${path}/${selected.id}`, value); else await create(path, value); setCreating(false); setSelected(null); await load(); setSavedMessage('提交成功！'); setDetailOpen(false); };
  const deleteItem = async (id) => { if (!confirm('确定删除此项吗？')) return; try { await remove(`${pathFor(active)}/${id}`); setSelected(null); await load(); setSavedMessage(`${title}已删除。`); setDetailOpen(false); } catch (error) { setMessage(error.message); } };
  const workflow = async (id, value) => { await update(`${active}/${id}/workflow`, value); setSelected(null); await load(); setSavedMessage('提交成功！'); setDetailOpen(false); };
  const navigateModule = (nextModule) => {
    if (nextModule === 'users') { setActive(nextModule); return; }
    setSelected(null); setCreating(false); setDetailOpen(false); setQuery(''); setSavedMessage(''); setActive(nextModule);
  };
  const title = modules.find(([key]) => key === active)?.[1]; const filteredItems = items.filter((item) => `${item.name ?? ''} ${item.title ?? ''} ${item.company ?? ''} ${item.category ?? ''}`.toLowerCase().includes(query.toLowerCase()));
  const detailTitle = creating ? `新建${title}` : selected?.name ?? selected?.title ?? selected?.company ?? title;
  return <main className={`app ${collapsed ? 'rail-collapsed' : ''}`}><aside><div className="brand-row"><a className="logo" href="#/"><span className="logo-glyph">N</span><span className="brand-copy"><b>NEXA</b><small>内容运营中心</small></span></a><button className="rail-toggle" aria-label={collapsed ? '展开菜单' : '收起菜单'} title={collapsed ? '展开菜单' : '收起菜单'} onClick={() => setCollapsed((value) => !value)}>{collapsed ? '›' : '‹'}</button></div><nav>{navSections.map(([section, keys]) => <section className="nav-section" key={section}><p>{section}</p>{keys.map((key) => { const label = modules.find(([module]) => module === key)?.[1]; return <button className={active === key ? 'active' : ''} key={key} title={collapsed ? label : undefined} onClick={() => navigateModule(key)}><i>{navIcons[key]}</i><span>{label}</span></button>; })}</section>)}</nav></aside><section className="content-shell"><div className="admin-header"><span className="header-brand">NEXA 内容运营中心</span><div className="header-account"><span>当前账号</span><b>{currentUser() || '管理员'}</b></div><button className="header-logout" onClick={() => { logout(); setLoggedIn(false); }}>退出登录</button></div><section className="main">{active === 'users' ? <><header><div><p className="breadcrumb">系统设置 / 账号管理</p><h1>账号管理</h1></div></header><UserManagement/></> : detailOpen ? <><header className="detail-header"><div><button className="back-button" onClick={() => { setDetailOpen(false); setCreating(false); }}>← 返回{title}</button><p className="breadcrumb">内容运营 / {title}</p><h1>{detailTitle}</h1></div>{selected && <Button danger onClick={() => deleteItem(selected.id)}>删除</Button>}</header><Notice error={Boolean(message)}>{message}</Notice>{isSubmission(active) ? <Submission active={active} item={selected} onSave={workflow}/> : <Editor active={active} item={selected} creating={creating} groups={groups} newsCategories={newsCategories} onSave={save} onDelete={deleteItem}/>}</> : <><header><div><p className="breadcrumb">内容运营 / {title}</p><h1>{title}</h1></div>{!isSubmission(active) && <button className="primary new" onClick={() => { setSelected(null); setCreating(true); setDetailOpen(true); }}>新建{title}</button>}</header><Notice error={Boolean(message) && message !== '正在读取…'}>{message}</Notice><Notice>{savedMessage}</Notice><section className="records-page"><div className="records-toolbar"><div><b>{isSubmission(active) ? '待处理队列' : `${title}列表`}</b><span>{items.length} 条记录</span></div><input aria-label="搜索当前清单" placeholder="搜索标题、分类…" value={query} onChange={(event) => setQuery(event.target.value)}/></div><div className="records-table">{filteredItems.map((item) => <div className="record-row" key={item.id}><button className="record-view" onClick={() => { setSelected(item); setCreating(false); setDetailOpen(true); }}><span><b>{item.name ?? item.title ?? item.company}</b><small>{item.summary ?? item.description ?? item.contact ?? '—'}</small></span><em>{item.workflow_status ?? (item.published === false ? '草稿' : item.category ?? '已发布')}</em><i>查看 ›</i></button><button className="record-delete" type="button" onClick={() => deleteItem(item.id)}>删除</button></div>)}{!filteredItems.length && !message && <p className="empty">{query ? '没有匹配的记录。' : '还没有记录。'}</p>}</div></section></>}</section></section></main>;
}
