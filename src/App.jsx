import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── THEME ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#07090F",
  surface: "#0D1117",
  card: "#111827",
  card2: "#161D2F",
  border: "#1E2D45",
  accent: "#3B82F6",
  accentDim: "#3B82F618",
  emerald: "#10B981",
  rose: "#F43F5E",
  amber: "#F59E0B",
  violet: "#8B5CF6",
  text: "#F1F5F9",
  muted: "#64748B",
  subtle: "#1A2232",
};
const AV_COLORS = ["#3B82F6","#10B981","#F59E0B","#F43F5E","#8B5CF6","#06B6D4","#EC4899","#84CC16"];

// ─── UTILS ───────────────────────────────────────────────────────────────────
function calcSettlements(members, expenses) {
  const balance = {};
  members.forEach(m => balance[m] = 0);
  expenses.forEach(({ amount, paidBy, splitBetween }) => {
    if (!splitBetween?.length) return;
    const share = amount / splitBetween.length;
    balance[paidBy] = (balance[paidBy] || 0) + amount;
    splitBetween.forEach(m => { balance[m] = (balance[m] || 0) - share; });
  });
  const pos = [], neg = [];
  Object.entries(balance).forEach(([name, bal]) => {
    if (bal > 0.01) pos.push({ name, amt: bal });
    else if (bal < -0.01) neg.push({ name, amt: -bal });
  });
  const settlements = [], p = pos.map(x=>({...x})), n = neg.map(x=>({...x}));
  let i = 0, j = 0;
  while (i < p.length && j < n.length) {
    const send = Math.min(p[i].amt, n[j].amt);
    settlements.push({ from: n[j].name, to: p[i].name, amount: send });
    p[i].amt -= send; n[j].amt -= send;
    if (p[i].amt < 0.01) i++;
    if (n[j].amt < 0.01) j++;
  }
  return { balance, settlements };
}

// ─── MICRO COMPONENTS ────────────────────────────────────────────────────────
function Avatar({ name, size = 32, idx = 0 }) {
  const bg = AV_COLORS[idx % AV_COLORS.length];
  const init = name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() || "?";
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:bg,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.35, fontWeight:700, color:"#fff", flexShrink:0,
      fontFamily:"'DM Mono',monospace" }}>{init}</div>
  );
}

function Chip({ label, selected, onClick, idx }) {
  const color = AV_COLORS[idx % AV_COLORS.length];
  return (
    <button onClick={onClick} style={{
      padding:"5px 13px", borderRadius:999, cursor:"pointer", fontSize:13, fontWeight:600,
      fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s",
      border:`1.5px solid ${selected ? color : C.border}`,
      background: selected ? `${color}22` : "transparent",
      color: selected ? color : C.muted, display:"flex", alignItems:"center", gap:5
    }}>
      {selected && <span style={{fontSize:9}}>✓</span>}{label}
    </button>
  );
}

function Btn({ children, onClick, variant="primary", disabled=false, full=false, style={}, loading=false }) {
  const bgMap = { primary:C.accent, danger:C.rose, ghost:"transparent", emerald:C.emerald, violet:C.violet, google:"#ffffff" };
  const bg = bgMap[variant] || C.accent;
  return (
    <button onClick={onClick} disabled={disabled || loading} style={{
      padding:"10px 20px", borderRadius:10, fontWeight:600, fontSize:14,
      cursor: (disabled||loading) ? "not-allowed" : "pointer",
      fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s", width:full?"100%":"auto",
      background: (disabled||loading) ? C.subtle : bg,
      color: variant==="google" ? "#111" : (disabled||loading) ? C.muted : "#fff",
      border: variant==="ghost" ? `1.5px solid ${C.border}` : "none",
      opacity: (disabled||loading) ? 0.7 : 1,
      display:"flex", alignItems:"center", justifyContent:"center", gap:8, ...style
    }}>{loading ? "⏳ Please wait..." : children}</button>
  );
}

function Input({ placeholder, value, onChange, type="text", style={}, onKeyDown }) {
  return (
    <input type={type} placeholder={placeholder} value={value} onChange={onChange} onKeyDown={onKeyDown}
      style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1.5px solid ${C.border}`,
        background:C.subtle, color:C.text, fontSize:14, fontFamily:"'DM Sans',sans-serif",
        outline:"none", boxSizing:"border-box", ...style }} />
  );
}

function Card({ children, style={} }) {
  return <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:16, padding:20, ...style }}>{children}</div>;
}

function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return ()=>clearTimeout(t); }, []);
  return (
    <div style={{
      position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
      background:C.emerald, color:"#fff", padding:"10px 22px", borderRadius:12,
      fontWeight:600, fontSize:14, fontFamily:"'DM Sans',sans-serif",
      boxShadow:"0 8px 32px #10B98144", zIndex:9999, animation:"slideUp 0.3s ease"
    }}>{msg}</div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize:11, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>{children}</div>;
}

function Spinner() {
  return (
    <div style={{ display:"flex", justifyContent:"center", padding:60 }}>
      <div style={{ width:32, height:32, border:`3px solid ${C.border}`,
        borderTop:`3px solid ${C.accent}`, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
    </div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error: e } = await supabase.auth.signUp({
          email, password: pass,
          options: { data: { full_name: name.trim() } }
        });
        if (e) throw e;
        if (data.user && !data.session) {
          setError("✉️ Check your email to confirm your account, then log in.");
          setLoading(false); return;
        }
        onLogin(data.user);
      } else {
        const { data, error: e } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (e) throw e;
        onLogin(data.user);
      }
    } catch (e) {
      setError(e.message || "Something went wrong.");
    }
    setLoading(false);
  };

  const googleLogin = async () => {
    setLoading(true);
    const { error: e } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
    if (e) { setError(e.message); setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center",
      padding:20, fontFamily:"'DM Sans',sans-serif",
      backgroundImage:`radial-gradient(ellipse at 30% 20%, #1E3A5F44 0%, transparent 55%),
        radial-gradient(ellipse at 70% 80%, #10294044 0%, transparent 55%)` }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500;600&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        @keyframes slideUp { from{opacity:0;transform:translate(-50%,20px)} to{opacity:1;transform:translate(-50%,0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        input::placeholder{color:#3A4D63} * {box-sizing:border-box}
      `}</style>

      <div style={{ width:"100%", maxWidth:520, animation:"fadeUp 0.4s ease" }}>
        <div style={{ flex:1, display:"flex", justifyContent:"center" }}>
          <img src="/logo1.png" style={{ width:200, height:200, borderRadius:75, objectFit:"cover" }} />
        </div>

        <Card style={{ padding:28 }}>
          <Btn variant="google" full onClick={googleLogin} loading={loading} style={{ marginBottom:16, fontWeight:700 }}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </Btn>

          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
            <div style={{ flex:1, height:1, background:C.border }} />
            <span style={{ color:C.muted, fontSize:12 }}>or</span>
            <div style={{ flex:1, height:1, background:C.border }} />
          </div>

          <div style={{ display:"flex", background:C.subtle, borderRadius:10, padding:4, marginBottom:24 }}>
            {["login","signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
                flex:1, padding:"8px 0", borderRadius:8, border:"none", cursor:"pointer",
                fontWeight:600, fontSize:14, fontFamily:"'DM Sans',sans-serif", transition:"all 0.2s",
                background: mode===m ? C.accent : "transparent",
                color: mode===m ? "#fff" : C.muted
              }}>{m === "login" ? "Log In" : "Sign Up"}</button>
            ))}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {mode === "signup" && (
              <div>
                <Label>Your Name</Label>
                <Input placeholder="e.g. Mukesh Reddy" value={name} onChange={e=>setName(e.target.value)} />
              </div>
            )}
            <div>
              <Label>Email</Label>
              <Input placeholder="you@email.com" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
            <div>
              <Label>Password</Label>
              <Input placeholder="••••••••" type="password" value={pass} onChange={e=>setPass(e.target.value)}
                onKeyDown={e => e.key==="Enter" && submit()} />
            </div>
          </div>

          {error && (
            <div style={{ marginTop:12, padding:"10px 14px", borderRadius:10,
              background:`${C.rose}15`, border:`1px solid ${C.rose}33`, color:C.rose, fontSize:13 }}>
              {error}
            </div>
          )}

          <Btn onClick={submit} loading={loading} full style={{ marginTop:18 }}>
            {mode === "login" ? "Log In →" : "Create Account →"}
          </Btn>
        </Card>

        <p style={{ textAlign:"center", color:C.muted, fontSize:12, marginTop:16 }}>
          Powered by Supabase · Data synced across all devices
        </p>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ user, onOpen, onNew, onLogout }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";

  const fetchGroups = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("groups")
      .select(`*, members(*), expenses(*)`)
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    setGroups(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchGroups();
    const token = window.location.hash.slice(1);
    if (token) {
      supabase.from("groups").select(`*, members(*), expenses(*)`)
        .eq("share_token", token).single()
        .then(({ data }) => { if (data) onOpen(data); });
    }
  }, []);

  const deleteGroup = async (e, id) => {
    e.stopPropagation();
    if (!confirm("Delete this group? This cannot be undone.")) return;
    await supabase.from("groups").delete().eq("id", id);
    setGroups(g => g.filter(x => x.id !== id));
    setToast("Group deleted");
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'DM Sans',sans-serif",
      backgroundImage:`radial-gradient(ellipse at 20% 0%, #1E3A5F33 0%, transparent 60%)` }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}} @keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box} input::placeholder{color:#3A4D63}`}</style>

      <div style={{ padding:"16px 24px", display:"flex", alignItems:"center", gap:12,
        borderBottom:`1px solid ${C.border}`, background:`${C.surface}CC`, backdropFilter:"blur(12px)",
        position:"sticky", top:0, zIndex:100 }}>
        <img src="/logo.png" style={{ width:36, height:36, borderRadius:10, objectFit:"cover" }} />
        <div>
          <div style={{ fontWeight:700, fontSize:16, letterSpacing:-0.3 }}>SplitVit</div>
          <div style={{ fontSize:11, color:C.muted }}>Welcome back, {displayName.split(" ")[0]}</div>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:10, alignItems:"center" }}>
          {user.user_metadata?.avatar_url
            ? <img src={user.user_metadata.avatar_url} style={{ width:32, height:32, borderRadius:"50%", border:`2px solid ${C.border}` }} />
            : <Avatar name={displayName} size={32} idx={0} />
          }
          <button onClick={onLogout} style={{ background:"none", border:`1px solid ${C.border}`,
            borderRadius:8, padding:"5px 12px", color:C.muted, cursor:"pointer",
            fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>Log out</button>
        </div>
      </div>

      <div style={{ maxWidth:600, margin:"0 auto", padding:"28px 16px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div>
            <h2 style={{ margin:0, fontSize:20, fontWeight:700, letterSpacing:-0.4 }}>Your Groups</h2>
            <p style={{ margin:"4px 0 0", fontSize:13, color:C.muted }}>{groups.length} group{groups.length !== 1 ? "s" : ""} saved</p>
          </div>
          <Btn onClick={onNew}>+ New Group</Btn>
        </div>

        {loading ? <Spinner /> : groups.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 20px", color:C.muted }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🧾</div>
            <div style={{ fontWeight:600, fontSize:16, color:C.text }}>No groups yet</div>
            <div style={{ fontSize:14, marginTop:6 }}>Create your first group to start splitting expenses</div>
            <Btn onClick={onNew} style={{ marginTop:20 }}>Create Group →</Btn>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {groups.map((g, i) => {
              const memberNames = g.members?.map(m => m.name) || [];
              const expsNorm = (g.expenses || []).map(e => ({
                ...e, paidBy: e.paid_by, splitBetween: e.split_between, amount: Number(e.amount)
              }));
              const total = expsNorm.reduce((s,e)=>s+e.amount, 0);
              const { settlements } = calcSettlements(memberNames, expsNorm);
              return (
                <div key={g.id} onClick={() => onOpen(g)} style={{
                  background:C.card2, border:`1px solid ${C.border}`, borderRadius:14,
                  padding:"16px 20px", cursor:"pointer", transition:"border-color 0.15s, transform 0.1s",
                  display:"flex", alignItems:"center", gap:14,
                  animation:`fadeUp 0.3s ease ${i*0.05}s both`
                }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=`${C.accent}55`;e.currentTarget.style.transform="translateY(-1px)"}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="none"}}>
                  <div style={{ width:44, height:44, borderRadius:12,
                    background:`linear-gradient(135deg, ${AV_COLORS[i%AV_COLORS.length]}44, ${AV_COLORS[(i+2)%AV_COLORS.length]}22)`,
                    border:`1px solid ${AV_COLORS[i%AV_COLORS.length]}33`,
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>
                    {g.name?.[0]?.toUpperCase() || "G"}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:15 }}>{g.name}</div>
                    <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>
                      {memberNames.length} members · {expsNorm.length} expenses
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontWeight:700, color:C.emerald }}>₹{total.toFixed(0)}</div>
                    <div style={{ fontSize:11, color: settlements.length ? C.rose : C.emerald, marginTop:2 }}>
                      {settlements.length ? `${settlements.length} pending` : "Settled ✓"}
                    </div>
                  </div>
                  <button onClick={e=>deleteGroup(e, g.id)} style={{ background:"none", border:"none",
                    cursor:"pointer", color:C.muted, fontSize:16, padding:4, opacity:0.5 }}>🗑️</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {toast && <Toast msg={toast} onDone={()=>setToast("")} />}
    </div>
  );
}

// ─── GROUP APP ────────────────────────────────────────────────────────────────
function GroupApp({ user, initialGroup, onBack, onSave }) {
  const isNew = !initialGroup?.id;
  const [step, setStep] = useState(isNew ? 1 : 3);
  const [groupName, setGroupName] = useState(initialGroup?.name || initialGroup?.groupName || "");
  const [groupId, setGroupId] = useState(initialGroup?.id || null);
  const [shareToken, setShareToken] = useState(initialGroup?.share_token || null);
  const [memberInput, setMemberInput] = useState("");
  const [members, setMembers] = useState(
    (initialGroup?.members || []).map(m => typeof m === "string" ? m : m.name)
  );
  const [memberIds, setMemberIds] = useState(
    Object.fromEntries((initialGroup?.members || []).filter(m=>typeof m==="object").map(m=>[m.name, m.id]))
  );
  const [expenses, setExpenses] = useState(
    (initialGroup?.expenses || []).map(e => ({
      id: e.id, title: e.title, amount: Number(e.amount),
      paidBy: e.paid_by || e.paidBy, splitBetween: e.split_between || e.splitBetween || [],
    }))
  );
  const [expTitle, setExpTitle] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expPaidBy, setExpPaidBy] = useState("");
  const [expSplit, setExpSplit] = useState([]);
  const [editIdx, setEditIdx] = useState(null);
  const [toast, setToast] = useState("");
  const [shareModal, setShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const totalExp = expenses.reduce((s,e)=>s+e.amount, 0);
  const { balance, settlements } = calcSettlements(members, expenses);

  const ensureGroup = async () => {
    if (groupId) return groupId;
    setSaving(true);
    const { data, error } = await supabase.from("groups")
      .insert({ name: groupName, owner_id: user.id })
      .select().single();
    setSaving(false);
    if (error) { setToast("Error creating group"); return null; }
    setGroupId(data.id);
    setShareToken(data.share_token);
    return data.id;
  };

  const addMember = async () => {
    const name = memberInput.trim();
    if (!name || members.includes(name)) return;
    const gid = await ensureGroup();
    if (!gid) return;
    setSaving(true);
    const { data, error } = await supabase.from("members")
      .insert({ group_id: gid, name }).select().single();
    setSaving(false);
    if (!error) {
      setMembers(p => [...p, name]);
      setMemberIds(p => ({ ...p, [name]: data.id }));
      setMemberInput("");
    }
  };

  const removeMember = async (name) => {
    const id = memberIds[name];
    if (id) await supabase.from("members").delete().eq("id", id);
    setMembers(p => p.filter(x=>x!==name));
    setMemberIds(p => { const n={...p}; delete n[name]; return n; });
  };

  const saveExpense = async () => {
    if (!expTitle || !expAmount || !expPaidBy || !expSplit.length) return;
    setSaving(true);
    const payload = { group_id: groupId, title: expTitle, amount: parseFloat(expAmount), paid_by: expPaidBy, split_between: expSplit };
    if (editIdx !== null) {
      const expId = expenses[editIdx].id;
      const { data } = await supabase.from("expenses").update(payload).eq("id", expId).select().single();
      const normalized = { id:data.id, title:data.title, amount:Number(data.amount), paidBy:data.paid_by, splitBetween:data.split_between };
      setExpenses(p => p.map((e,i) => i===editIdx ? normalized : e));
      setEditIdx(null);
    } else {
      const { data } = await supabase.from("expenses").insert(payload).select().single();
      const normalized = { id:data.id, title:data.title, amount:Number(data.amount), paidBy:data.paid_by, splitBetween:data.split_between };
      setExpenses(p => [...p, normalized]);
    }
    setExpTitle(""); setExpAmount(""); setExpPaidBy(""); setExpSplit([]);
    setToast("Expense saved ✓");
    setSaving(false);
  };

  const deleteExpense = async (i) => {
    const expId = expenses[i].id;
    if (expId) await supabase.from("expenses").delete().eq("id", expId);
    setExpenses(p => p.filter((_,idx)=>idx!==i));
  };

  const startEdit = (i) => {
    const e = expenses[i];
    setExpTitle(e.title); setExpAmount(String(e.amount));
    setExpPaidBy(e.paidBy); setExpSplit(e.splitBetween);
    setEditIdx(i); setStep(2);
  };

  const generateShareLink = async () => {
    const gid = await ensureGroup();
    if (!gid || !shareToken) return;
    const url = `${window.location.origin}${window.location.pathname}#${shareToken}`;
    setShareUrl(url);
    setShareModal(true);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => setToast("Link copied! 🔗"));
  };

  const STEPS = ["Create Group","Add Expenses","Settlement"];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'DM Sans',sans-serif",
      backgroundImage:`radial-gradient(ellipse at 20% 0%, #1E3A5F33 0%, transparent 60%),
        radial-gradient(ellipse at 80% 100%, #10294033 0%, transparent 60%)` }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}} @keyframes slideUp{from{opacity:0;transform:translate(-50%,20px)}to{opacity:1;transform:translate(-50%,0)}} @keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box} input::placeholder{color:#3A4D63} select option{background:#161D2F}`}</style>

      <div style={{ padding:"14px 20px", display:"flex", alignItems:"center", gap:12,
        borderBottom:`1px solid ${C.border}`, background:`${C.surface}CC`, backdropFilter:"blur(12px)",
        position:"sticky", top:0, zIndex:100 }}>
        <button onClick={onBack} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8,
          padding:"5px 12px", color:C.muted, cursor:"pointer", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>← Back</button>
        <img src="/logo.png" style={{ width:32, height:32, borderRadius:9, objectFit:"cover" }} />
        <div style={{ fontWeight:700, fontSize:15, letterSpacing:-0.3 }}>{groupName || "New Group"}</div>
        {groupId && (
          <button onClick={generateShareLink} style={{ marginLeft:"auto", background:`${C.accent}18`,
            border:`1px solid ${C.accent}44`, borderRadius:8, padding:"5px 14px",
            color:C.accent, cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
            🔗 Share
          </button>
        )}
      </div>

      <div style={{ maxWidth:560, margin:"0 auto", padding:"24px 16px" }}>
        <div style={{ display:"flex", alignItems:"center", marginBottom:28 }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", flex: i<STEPS.length-1 ? 1 : "none" }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5, cursor: i+1 <= step ? "pointer":"default" }}
                onClick={() => { if(i+1 <= step) setStep(i+1); }}>
                <div style={{ width:34, height:34, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                  fontWeight:700, fontSize:13, transition:"all 0.3s",
                  background: step>i+1 ? C.emerald : step===i+1 ? C.accent : C.subtle,
                  border:`2px solid ${step>i+1 ? C.emerald : step===i+1 ? C.accent : C.border}`,
                  color: step>=i+1 ? "#fff" : C.muted,
                  boxShadow: step===i+1 ? `0 0 14px ${C.accent}55` : "none" }}>
                  {step>i+1 ? "✓" : i+1}
                </div>
                <span style={{ fontSize:10, fontWeight:600, color:step===i+1?C.text:C.muted, whiteSpace:"nowrap" }}>{label}</span>
              </div>
              {i<STEPS.length-1 && (
                <div style={{ flex:1, height:2, background:step>i+1?C.emerald:C.border, margin:"0 8px", marginBottom:20, transition:"background 0.3s" }} />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div style={{ animation:"fadeIn 0.3s ease" }}>
            <h2 style={{ margin:"0 0 4px", fontSize:20, fontWeight:700, letterSpacing:-0.4 }}>Create your group</h2>
            <p style={{ margin:"0 0 22px", color:C.muted, fontSize:13 }}>Name your group and add members</p>
            <Card style={{ marginBottom:14 }}>
              <Label>Group Name</Label>
              <Input placeholder="e.g. Goa Trip, Hostel Room..." value={groupName} onChange={e=>setGroupName(e.target.value)} />
            </Card>
            <Card>
              <Label>Members</Label>
              <div style={{ display:"flex", gap:8 }}>
                <Input placeholder="Enter member name" value={memberInput}
                  onChange={e=>setMemberInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addMember()} />
                <Btn onClick={addMember} loading={saving}>Add</Btn>
              </div>
              {members.length > 0 ? (
                <div style={{ marginTop:14, display:"flex", flexWrap:"wrap", gap:8 }}>
                  {members.map((m,i) => (
                    <div key={m} style={{ display:"flex", alignItems:"center", gap:7, padding:"5px 12px",
                      borderRadius:999, background:C.subtle, border:`1px solid ${C.border}` }}>
                      <Avatar name={m} size={20} idx={i} />
                      <span style={{ fontSize:13, fontWeight:500 }}>{m}</span>
                      <button onClick={()=>removeMember(m)} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:15, padding:0 }}>×</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ marginTop:14, textAlign:"center", color:C.muted, fontSize:13, padding:"10px 0" }}>Add at least 2 members</div>
              )}
            </Card>
            <div style={{ display:"flex", justifyContent:"flex-end", marginTop:18 }}>
              <Btn onClick={()=>setStep(2)} disabled={!groupName.trim()||members.length<2}>Next → Add Expenses</Btn>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation:"fadeIn 0.3s ease" }}>
            <h2 style={{ margin:"0 0 4px", fontSize:20, fontWeight:700, letterSpacing:-0.4 }}>Add expenses</h2>
            <p style={{ margin:"0 0 22px", color:C.muted, fontSize:13 }}>Record who paid and who was involved</p>
            <Card style={{ marginBottom:14 }}>
              <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                <div style={{ flex:1 }}>
                  <Label>Title</Label>
                  <Input placeholder="Dinner, Uber, Hotel..." value={expTitle} onChange={e=>setExpTitle(e.target.value)} />
                </div>
                <div style={{ width:120 }}>
                  <Label>Amount (₹)</Label>
                  <Input type="number" placeholder="0" value={expAmount} onChange={e=>setExpAmount(e.target.value)} />
                </div>
              </div>
              <Label>Paid By</Label>
              <select value={expPaidBy} onChange={e=>setExpPaidBy(e.target.value)} style={{
                width:"100%", padding:"10px 14px", borderRadius:10, border:`1.5px solid ${C.border}`,
                background:C.subtle, color:expPaidBy?C.text:"#3A4D63", fontSize:14,
                fontFamily:"'DM Sans',sans-serif", outline:"none", cursor:"pointer", marginBottom:12 }}>
                <option value="">Select who paid</option>
                {members.map(m=><option key={m} value={m}>{m}</option>)}
              </select>
              <Label>Split Between</Label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:6 }}>
                <button onClick={()=>setExpSplit(expSplit.length===members.length?[]:[...members])} style={{
                  padding:"5px 13px", borderRadius:999, cursor:"pointer", fontSize:12, fontWeight:700,
                  fontFamily:"'DM Sans',sans-serif", border:`1.5px solid ${C.border}`,
                  background:expSplit.length===members.length?C.accentDim:"transparent",
                  color:expSplit.length===members.length?C.accent:C.muted }}>All</button>
                {members.map((m,i)=>(
                  <Chip key={m} label={m} selected={expSplit.includes(m)}
                    onClick={()=>setExpSplit(p=>p.includes(m)?p.filter(x=>x!==m):[...p,m])} idx={i} />
                ))}
              </div>
              {expAmount && expSplit.length > 0 && (
                <div style={{ marginTop:10, padding:"8px 12px", borderRadius:10,
                  background:`${C.accent}11`, border:`1px solid ${C.accent}22`, fontSize:13, color:C.accent }}>
                  ₹{(parseFloat(expAmount||0)/expSplit.length).toFixed(2)} per person × {expSplit.length}
                </div>
              )}
              <Btn onClick={saveExpense} disabled={!expTitle||!expAmount||!expPaidBy||!expSplit.length}
                loading={saving} full style={{ marginTop:14 }}>
                {editIdx!==null ? "Update Expense ✓" : "+ Add Expense"}
              </Btn>
            </Card>
            {expenses.length > 0 && (
              <>
                <div style={{ fontSize:12, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>
                  {expenses.length} expense{expenses.length>1?"s":""} · ₹{totalExp.toFixed(2)} total
                </div>
                {expenses.map((e,i)=>(
                  <div key={i} style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:12,
                    padding:"12px 16px", marginBottom:8, display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:14 }}>{e.title}</div>
                      <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{e.paidBy} paid · {e.splitBetween.join(", ")}</div>
                    </div>
                    <span style={{ fontFamily:"'DM Mono',monospace", fontWeight:600, color:C.emerald }}>₹{e.amount.toFixed(2)}</span>
                    <button onClick={()=>startEdit(i)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:14,color:C.muted,padding:4 }}>✏️</button>
                    <button onClick={()=>deleteExpense(i)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:14,color:C.rose,padding:4 }}>🗑️</button>
                  </div>
                ))}
              </>
            )}
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:16 }}>
              <Btn variant="ghost" onClick={()=>setStep(1)}>← Back</Btn>
              <Btn onClick={()=>setStep(3)} disabled={expenses.length===0}>View Settlement →</Btn>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ animation:"fadeIn 0.3s ease" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}>
              <div>
                <h2 style={{ margin:"0 0 4px", fontSize:20, fontWeight:700, letterSpacing:-0.4 }}>Settlement</h2>
                <p style={{ margin:0, color:C.muted, fontSize:13 }}>{groupName} · ₹{totalExp.toFixed(2)} total · {expenses.length} expenses</p>
              </div>
              <Btn onClick={()=>setStep(2)} variant="ghost" style={{ fontSize:12 }}>+ Expense</Btn>
            </div>
            <Card style={{ marginBottom:14 }}>
              <Label>Per Person Balance</Label>
              {members.map((m,i)=>{
                const bal = balance[m]||0;
                const pos=bal>0.01, neg=bal<-0.01;
                return (
                  <div key={m} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0",
                    borderBottom:i<members.length-1?`1px solid ${C.border}`:"none" }}>
                    <Avatar name={m} size={30} idx={i} />
                    <span style={{ flex:1, fontWeight:500, fontSize:14 }}>{m}</span>
                    <span style={{ fontFamily:"'DM Mono',monospace", fontWeight:700, fontSize:14,
                      color:pos?C.emerald:neg?C.rose:C.muted }}>
                      {pos?`+₹${bal.toFixed(2)}`:neg?`-₹${Math.abs(bal).toFixed(2)}`:"Settled ✓"}
                    </span>
                  </div>
                );
              })}
            </Card>
            {settlements.length===0 ? (
              <div style={{ background:`${C.emerald}11`, border:`1px solid ${C.emerald}33`, borderRadius:14,
                padding:24, textAlign:"center", marginBottom:14 }}>
                <div style={{ fontSize:32, marginBottom:8 }}>🎉</div>
                <div style={{ fontWeight:700, fontSize:16, color:C.emerald }}>All Settled!</div>
                <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>Everyone's expenses are balanced.</div>
              </div>
            ) : (
              <Card style={{ marginBottom:14 }}>
                <Label>Who Owes Whom · {settlements.length} transaction{settlements.length>1?"s":""}</Label>
                {settlements.map((s,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 0",
                    borderBottom:i<settlements.length-1?`1px solid ${C.border}`:"none" }}>
                    <Avatar name={s.from} size={28} idx={members.indexOf(s.from)} />
                    <div style={{ flex:1, fontSize:14 }}>
                      <span style={{ fontWeight:600 }}>{s.from}</span>
                      <span style={{ color:C.muted }}> owes </span>
                      <span style={{ fontWeight:600 }}>{s.to}</span>
                    </div>
                    <div style={{ background:`${C.rose}15`, border:`1px solid ${C.rose}33`,
                      borderRadius:8, padding:"4px 12px",
                      fontFamily:"'DM Mono',monospace", fontWeight:700, color:C.rose, fontSize:14 }}>
                      ₹{s.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </Card>
            )}
            {expenses.length > 0 && (
              <Card>
                <Label>Expense Breakdown</Label>
                {expenses.map((e,i)=>(
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                    padding:"8px 0", borderBottom:i<expenses.length-1?`1px solid ${C.border}`:"none", fontSize:13 }}>
                    <div>
                      <span style={{ fontWeight:500 }}>{e.title}</span>
                      <span style={{ color:C.muted }}> · {e.paidBy}</span>
                    </div>
                    <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                      <span style={{ fontFamily:"'DM Mono',monospace", color:C.amber }}>₹{e.amount.toFixed(2)}</span>
                      <button onClick={()=>startEdit(i)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:12,color:C.muted,padding:2 }}>✏️</button>
                      <button onClick={()=>deleteExpense(i)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:12,color:C.rose,padding:2 }}>🗑️</button>
                    </div>
                  </div>
                ))}
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:12, paddingTop:10,
                  borderTop:`1px solid ${C.border}`, fontWeight:700 }}>
                  <span>Total</span>
                  <span style={{ fontFamily:"'DM Mono',monospace" }}>₹{totalExp.toFixed(2)}</span>
                </div>
              </Card>
            )}
            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <Btn variant="ghost" onClick={generateShareLink} full>🔗 Share Group Link</Btn>
              <Btn variant="ghost" onClick={onBack} full>← All Groups</Btn>
            </div>
          </div>
        )}
      </div>

      {shareModal && (
        <div style={{ position:"fixed", inset:0, background:"#00000088", backdropFilter:"blur(4px)",
          display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20 }}>
          <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:18, padding:28,
            width:"100%", maxWidth:400, animation:"fadeIn 0.2s ease" }}>
            <div style={{ fontWeight:700, fontSize:18, marginBottom:6 }}>🔗 Share Group</div>
            <p style={{ color:C.muted, fontSize:13, marginBottom:16 }}>
              Anyone with this link can view the settlement summary — works across all devices!
            </p>
            <div style={{ background:C.subtle, borderRadius:10, padding:"10px 14px", fontSize:12,
              fontFamily:"'DM Mono',monospace", color:C.accent, wordBreak:"break-all", marginBottom:16 }}>
              {shareUrl}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <Btn onClick={copyLink} full>Copy Link</Btn>
              <Btn variant="ghost" onClick={()=>setShareModal(false)} full>Close</Btn>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast} onDone={()=>setToast("")} />}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [activeGroup, setActiveGroup] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null); setView("dashboard"); setActiveGroup(null);
    window.location.hash = "";
  };

  if (authLoading) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:16 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box}`}</style>
      <img src="/logo1.png" style={{ width:80, height:80, borderRadius:24, objectFit:"cover", opacity:0.8 }} />
      <div style={{ width:32, height:32, border:`3px solid ${C.border}`,
        borderTop:`3px solid ${C.accent}`, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
    </div>
  );

  if (!user) return <LoginPage onLogin={setUser} />;

  if (view === "group") return (
    <GroupApp user={user} initialGroup={activeGroup}
      onBack={() => { setView("dashboard"); setActiveGroup(null); window.location.hash = ""; }}
      onSave={() => {}} />
  );

  return (
    <Dashboard user={user}
      onOpen={(g) => { setActiveGroup(g); setView("group"); }}
      onNew={() => { setActiveGroup(null); setView("group"); }}
      onLogout={logout} />
  );
}
