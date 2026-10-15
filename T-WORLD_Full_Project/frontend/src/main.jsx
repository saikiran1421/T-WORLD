import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Compass, MapPin, Sparkles, Wallet, Trophy, CloudRain, Bot, Train, BedDouble,
  Utensils, Ticket, ArrowUpRight, ChevronRight, Check, Zap, ShieldCheck, Send,
  Menu, X, Clock3, Coins, Flame, Navigation, RefreshCw, BadgeCheck, CircleDollarSign
} from 'lucide-react'
import './styles.css'

const API = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
const money = n => '₹' + Number(n || 0).toLocaleString('en-IN')
const fallbackTrip = {
  destination:'Tirupati', tagline:'Temple trails & hill-country calm', days:3, budget:5000,
  estimated_total:3650, remaining:1350, budget_used_percent:73,
  budget_items:[{name:'Transport',amount:900,icon:'train'},{name:'Stay',amount:900,icon:'bed'},{name:'Food',amount:1350,icon:'utensils'},{name:'Activities',amount:500,icon:'ticket'}],
  itinerary:[1,2,3].map((d)=>({day:d,title:['Discover Tirupati','Explore Tirumala','Collect memories'][d-1],date:'Day '+d,activities:[
    {id:`${d}-1`,time:'08:00',title:'Kapila Theertham',kind:'Nature',cost:0,duration:'1 hr'},
    {id:`${d}-2`,time:'11:00',title:'Local culture & heritage',kind:'Culture',cost:100,duration:'2 hrs'},
    {id:`${d}-3`,time:'16:00',title:'Affordable local food stop',kind:'Food',cost:180,duration:'1 hr'}
  ]})), rainy_simulation:false
}
function App(){
  const [destination,setDestination]=useState('Tirupati')
  const [days,setDays]=useState(3)
  const [budget,setBudget]=useState(5000)
  const [interests,setInterests]=useState(['Culture','Food','Nature'])
  const [trip,setTrip]=useState(fallbackTrip)
  const [loading,setLoading]=useState(false)
  const [apiStatus,setApiStatus]=useState('checking')
  const [eventOn,setEventOn]=useState(false)
  const [xp,setXp]=useState(Number(localStorage.getItem('tq-xp')||0))
  const [coins,setCoins]=useState(Number(localStorage.getItem('tq-coins')||0))
  const [completed,setCompleted]=useState(JSON.parse(localStorage.getItem('tq-quests')||'[]'))
  const [chat,setChat]=useState([{from:'bot',text:"Hey explorer! I'm Questy 🌍 Tell me what matters most — saving money, local food, or hidden gems?"}])
  const [message,setMessage]=useState('')
  const [mobileMenu,setMobileMenu]=useState(false)
  const [toast,setToast]=useState('')
  const level=1+Math.floor(xp/250)
  const progress=(xp%250)/250*100

  useEffect(()=>{fetch(`${API}/api/health`).then(r=>{if(!r.ok)throw Error();return r.json()}).then(()=>setApiStatus('online')).catch(()=>setApiStatus('offline'))},[])
  useEffect(()=>{localStorage.setItem('tq-xp',xp);localStorage.setItem('tq-coins',coins);localStorage.setItem('tq-quests',JSON.stringify(completed))},[xp,coins,completed])
  const spent=trip.estimated_total||0
  const remaining=Math.max(0,(trip.budget||budget)-spent)
  const budgetPercent=Math.min(100,Math.round(spent/(trip.budget||budget)*100))
  const activeQuests=[
    {id:'budget-plan',title:'Master your budget',desc:'Build a trip that respects your spending limit',reward:'+75 XP · 25 coins',icon:Wallet},
    {id:'free-attractions',title:'Freebie finder',desc:'Explore free experiences and save your coins',reward:'+100 XP · 30 coins',icon:Compass},
    {id:'rain-adapt',title:'Weather wizard',desc:'Adapt your itinerary to a simulated rain event',reward:'+50 XP · 20 coins',icon:CloudRain},
    {id:'local-food',title:'Local food scout',desc:'Make room for local flavours without overspending',reward:'+60 XP · 15 coins',icon:Utensils}
  ]
  async function generate(rain=false){
    setLoading(true)
    const payload={destination,days:Number(days),budget:Number(budget),interests}
    try{
      const response=await fetch(`${API}/api/${rain?'weather-event':'trip'}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      if(!response.ok)throw Error('API request failed')
      const data=await response.json();setTrip(data);setEventOn(rain);setApiStatus('online')
      if(rain)setToast('Rain simulation activated — itinerary adapted!')
      else setToast('Your adventure has been generated!')
    }catch(e){
      const local={...fallbackTrip,destination,budget:Number(budget),days:Number(days),rainy_simulation:rain,
        estimated_total:Math.min(Number(budget),fallbackTrip.estimated_total),remaining:Math.max(0,Number(budget)-fallbackTrip.estimated_total),
        itinerary:Array.from({length:Number(days)},(_,i)=>({day:i+1,title:`${rain?'Rain-safe':'Explore'} ${destination}`,date:`Day ${i+1}`,activities:(rain?[
          {id:`${i}-a`,time:'10:00',title:'Indoor museum or heritage centre',kind:'Culture',cost:100,duration:'2 hrs',outdoor:false},
          {id:`${i}-b`,time:'13:00',title:'Local food discovery',kind:'Food',cost:180,duration:'1 hr',outdoor:false},
          {id:`${i}-c`,time:'15:00',title:'Covered market & crafts',kind:'Culture',cost:120,duration:'1 hr',outdoor:false}
        ]:[
          {id:`${i}-a`,time:'08:00',title:`Discover ${destination} highlights`,kind:'Explore',cost:100,duration:'2 hrs'},
          {id:`${i}-b`,time:'12:00',title:'Affordable local lunch',kind:'Food',cost:180,duration:'1 hr'},
          {id:`${i}-c`,time:'16:00',title:'Free scenic stop',kind:'Scenic',cost:0,duration:'1 hr'}
        ])}))}
      setTrip(local);setEventOn(rain);setApiStatus('offline')
      setToast('Using offline demo planner — start backend for full API.')
    }finally{setLoading(false);setTimeout(()=>setToast(''),3500)}
  }
  async function completeQuest(q){
    if(completed.includes(q.id))return
    try{
      const r=await fetch(`${API}/api/quest/complete`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({quest_id:q.id,current_xp:xp,current_coins:coins})})
      if(!r.ok)throw Error()
      const data=await r.json();setXp(data.xp);setCoins(data.coins)
    }catch(e){
      const rewards={'budget-plan':[75,25],'free-attractions':[100,30],'rain-adapt':[50,20],'local-food':[60,15]}[q.id]||[40,10]
      setXp(v=>v+rewards[0]);setCoins(v=>v+rewards[1])
    }
    setCompleted(v=>[...v,q.id]);setToast(`Quest complete: ${q.title}!`);setTimeout(()=>setToast(''),2800)
  }
  async function sendChat(e){
    e?.preventDefault();if(!message.trim())return
    const text=message.trim();setChat(v=>[...v,{from:'you',text}]);setMessage('')
    try{
      const r=await fetch(`${API}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,destination,budget,remaining})})
      if(!r.ok)throw Error()
      const data=await r.json();setChat(v=>[...v,{from:'bot',text:data.reply}])
    }catch{
      const reply=/rain|weather|indoor/i.test(text)?'Try the Heavy Rain event to switch to indoor-friendly activities. It is a simulation, not a live forecast.':/budget|cheap|save|cost/i.test(text)?`You have approximately ${money(remaining)} left in this estimate. Prioritize public transport, local meals, and free attractions.`:`For ${destination}, keep one paid highlight per day, look for local food, and leave a little emergency buffer. I'm using the built-in demo assistant.`
      setChat(v=>[...v,{from:'bot',text:reply}])
    }
  }
  const budgetRows=trip.budget_items||fallbackTrip.budget_items
  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu?'open':''}`}>
      <div className="brand"><div className="brand-mark"><Compass size={24}/></div><div><b>T-WORLD</b><small>YOUR ADVENTURE OS</small></div><button className="mobile-close" onClick={()=>setMobileMenu(false)}><X/></button></div>
      <div className="profile-mini"><div className="avatar">🧭</div><div><b>Explorer</b><small>Level {level} Adventurer</small></div><span className="online-dot"/></div>
      <div className="nav-label">YOUR JOURNEY</div>
      <a className="nav-item active" href="#overview" onClick={()=>setMobileMenu(false)}><Compass size={18}/> Adventure hub <span className="nav-live">LIVE</span></a>
      <a className="nav-item" href="#itinerary" onClick={()=>setMobileMenu(false)}><MapPin size={18}/> My itinerary</a>
      <a className="nav-item" href="#budget" onClick={()=>setMobileMenu(false)}><Wallet size={18}/> Budget guardian</a>
      <a className="nav-item" href="#quests" onClick={()=>setMobileMenu(false)}><Trophy size={18}/> Quest board <span className="nav-count">{activeQuests.filter(q=>!completed.includes(q.id)).length}</span></a>
      <div className="sidebar-bottom"><div className="level-card"><div className="level-top"><span><Zap size={14}/> LEVEL {level}</span><b>{xp} XP</b></div><div className="xp-track"><i style={{width:`${progress}%`}}/></div><small>{250-(xp%250)} XP to next level</small><div className="coin-row"><span>🪙 {coins} coins</span><span>🏅 {completed.length}/4 badges</span></div></div><div className="api-state"><span className={`state-dot ${apiStatus}`}/>{apiStatus==='online'?'Backend connected':apiStatus==='checking'?'Checking API…':'Offline demo mode'}</div></div>
    </aside>
    {mobileMenu&&<div className="scrim" onClick={()=>setMobileMenu(false)}/>}
    <main className="main">
      <header className="topbar"><button className="mobile-menu" onClick={()=>setMobileMenu(true)}><Menu/></button><div className="breadcrumb">Workspace <ChevronRight size={14}/> <b>Adventure hub</b></div><div className="top-actions"><div className="coin-pill"><Coins size={16}/>{coins.toLocaleString()} <span>COINS</span></div><div className="date-pill"><span className="online-dot"/> DEMO WORLD</div></div></header>
      <section className="hero" id="overview">
        <div className="hero-copy"><div className="eyebrow"><Sparkles size={14}/> THE WORLD IS YOUR PLAYGROUND</div><h1>Big adventures.<br/><span>Small budgets.</span></h1><p>Your AI-powered travel co-pilot turns every rupee into a new story. Plan smarter, unlock quests, travel further.</p><div className="hero-actions"><a href="#planner" className="primary-btn">Plan my adventure <ArrowUpRight size={17}/></a><a href="#quests" className="text-btn">Explore quests <ChevronRight size={16}/></a></div><div className="hero-proof"><div className="proof-avatars"><span>🧑🏻</span><span>👩🏽</span><span>🧑🏾</span></div><span><b>Made for curious explorers</b><small>Every budget deserves a great story</small></span></div></div>
        <div className="hero-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="planet">🌏</div><div className="floating-tag tag-top"><span>✦</span> QUEST UNLOCKED</div><div className="floating-tag tag-bottom"><span className="tag-icon">↗</span><div><b>₹1,350 saved</b><small>Budget power-up</small></div></div><div className="spark spark-a">✦</div><div className="spark spark-b">✧</div><div className="hero-stats"><span>DESTINATION <b>01 / ∞</b></span><span>ADVENTURE MODE <b className="green-text">ACTIVE</b></span></div></div>
      </section>
      <section className="stat-grid">
        <div className="stat-card"><div className="stat-icon cyan"><Navigation size={19}/></div><div><small>DESTINATION</small><h3>{trip.destination||destination}</h3><span className="stat-foot"><span className="tiny-dot"/> Adventure selected</span></div><MapPin className="stat-watermark"/></div>
        <div className="stat-card"><div className="stat-icon green"><Wallet size={19}/></div><div><small>TRIP BUDGET</small><h3>{money(trip.budget||budget)}</h3><span className="stat-foot">Your spending limit</span></div><CircleDollarSign className="stat-watermark"/></div>
        <div className="stat-card"><div className="stat-icon gold"><Trophy size={19}/></div><div><small>QUEST XP</small><h3>{xp.toLocaleString()} <em>XP</em></h3><span className="stat-foot">Level {level} explorer</span></div><Flame className="stat-watermark"/></div>
        <div className="stat-card"><div className="stat-icon purple"><BadgeCheck size={19}/></div><div><small>QUESTS DONE</small><h3>{completed.length}<em> / 4</em></h3><span className="stat-foot">Keep the streak alive</span></div><Trophy className="stat-watermark"/></div>
      </section>
      <section className="content-grid" id="planner">
        <div className="panel planner-panel"><div className="panel-heading"><div><div className="section-kicker">01 / BUILD YOUR QUEST</div><h2>Design your escape <span>✦</span></h2><p>Every great journey starts with a little curiosity.</p></div><div className="heading-icon"><Sparkles/></div></div>
          <div className="form-grid"><label className="field full"><span>WHERE TO, EXPLORER?</span><div className="select-wrap"><MapPin size={17}/><select value={destination} onChange={e=>setDestination(e.target.value)}><option>Tirupati</option><option>Hyderabad</option><option>Visakhapatnam</option><option>Bengaluru</option></select><ChevronRight size={15}/></div><small className="field-hint">{trip.tagline||'Pick a destination to begin.'}</small></label>
            <label className="field"><span>TRIP DURATION</span><div className="number-control"><button onClick={()=>setDays(v=>Math.max(1,v-1))}>−</button><b>{days} <small>{days===1?'DAY':'DAYS'}</small></b><button onClick={()=>setDays(v=>Math.min(14,v+1))}>+</button></div></label>
            <label className="field"><span>YOUR BUDGET (₹)</span><div className="budget-input"><span>₹</span><input type="number" min="500" max="1000000" step="500" value={budget} onChange={e=>setBudget(Math.max(500,Number(e.target.value)||500))}/></div></label>
          </div>
          <div className="field interests-field"><span>WHAT'S YOUR VIBE?</span><div className="interest-chips">{['Culture','Food','Nature','Adventure','Shopping'].map((it,i)=><button key={it} className={interests.includes(it)?'interest selected':'interest'} onClick={()=>setInterests(v=>v.includes(it)?v.filter(x=>x!==it):[...v,it])}>{['🏛️','🍜','🌿','🧗','🛍️'][i]} {it}{interests.includes(it)&&<Check size={13}/>}</button>)}</div></div>
          <button className="generate-btn" onClick={()=>generate(false)} disabled={loading}>{loading?<RefreshCw className="spin" size={18}/>:<Sparkles size={18}/>} {loading?'Crafting your adventure…':'Generate my adventure'} <ArrowUpRight size={17}/></button>
          <div className="planner-note"><ShieldCheck size={15}/> Budget-first planning <span/> Free demo · No booking required</div>
        </div>
        <div className="panel map-panel"><div className="panel-heading compact"><div><div className="section-kicker">ADVENTURE RADAR</div><h2>Quest map <span className="live-label"><i/> LIVE DEMO</span></h2></div><button className="icon-button" title="Refresh map" onClick={()=>setToast('Map markers are illustrative demo data.')}><RefreshCw size={16}/></button></div>
          <div className="map-visual"><div className="map-grid"/><div className="map-land land-one"/><div className="map-land land-two"/><svg className="route-svg" viewBox="0 0 400 300" preserveAspectRatio="none"><path d="M55 220 C100 185 100 130 165 145 S230 215 265 150 S325 85 350 75" fill="none" stroke="#26d9c2" strokeWidth="2.5" strokeDasharray="5 7"/><path d="M55 220 C100 185 100 130 165 145 S230 215 265 150 S325 85 350 75" fill="none" stroke="#26d9c2" strokeWidth="9" opacity=".08"/></svg><div className="map-pin pin-one"><span>⌂</span><small>START</small></div><div className="map-pin pin-two"><span>✦</span><small>QUEST 01</small></div><div className="map-pin pin-three"><span>♧</span><small>CHECKPOINT</small></div><div className="map-pin pin-four"><span>🏆</span><small>FINISH</small></div><div className="map-compass">N<br/><Navigation size={16}/></div><div className="map-label">INDIA · ADVENTURE ZONE</div><div className="map-legend"><span><i className="legend-active"/> Your route</span><span><i className="legend-locked"/> Locked quest</span></div></div>
          <div className="map-footer"><div className="map-footer-icon"><Compass size={19}/></div><div><b>{destination} discovery route</b><small>Illustrative quest map · Not live navigation</small></div><span className="route-distance">{days} DAYS <ChevronRight size={14}/></span></div>
        </div>
      </section>
      <section className="content-grid lower-grid">
        <div className="panel budget-panel" id="budget"><div className="panel-heading compact"><div><div className="section-kicker">02 / MONEY THAT MOVES WITH YOU</div><h2>Budget guardian <span>🛡️</span></h2></div><span className={`budget-status ${budgetPercent>90?'warning':''}`}>{budgetPercent>90?'NEAR LIMIT':'ON TRACK'}</span></div>
          <div className="budget-total"><div><small>ESTIMATED TRIP COST</small><h2>{money(spent)} <span>/ {money(trip.budget||budget)}</span></h2></div><div className="budget-percent">{budgetPercent}%<small>USED</small></div></div>
          <div className="big-progress"><i style={{width:`${budgetPercent}%`}} className={budgetPercent>90?'danger':''}/></div><div className="budget-caption"><span>₹0 spent</span><b>{money(remaining)} left to explore</b></div>
          <div className="expense-list">{budgetRows.map((row,i)=>{const Icon=({train:Train,bed:BedDouble,utensils:Utensils,ticket:Ticket})[row.icon]||CircleDollarSign;return <div className="expense-row" key={row.name}><div className={`expense-icon ex-${i}`}><Icon size={17}/></div><span>{row.name}<small>{['Getting there','Rest & recharge','Taste the place','Experiences'][i]||'Estimated'}</small></span><b>{money(row.amount)}</b><div className="expense-mini"><i style={{width:`${Math.min(100,row.amount/Math.max(1,spent)*100)}%`}}/></div></div>})}</div>
          <div className="savings-tip"><div>💡</div><p><b>Questy’s saving tip</b><br/>Choose local eateries and free highlights first. Treat every rupee saved as extra adventure fuel.</p></div>
          <p className="disclaimer">{trip.notice||'All figures are illustrative estimates, not live quotes.'}</p>
        </div>
        <div className="panel quests-panel" id="quests"><div className="panel-heading compact"><div><div className="section-kicker">03 / SIDE QUESTS</div><h2>Quest board <span>⚡</span></h2><p>Small wins. Big explorer energy.</p></div><span className="quest-counter">{completed.length}/4</span></div>
          <div className="quest-list">{activeQuests.map((q,i)=>{const Icon=q.icon,done=completed.includes(q.id);return <div className={`quest-row ${done?'done':''}`} key={q.id}><div className={`quest-icon qi-${i}`}>{done?<Check size={20}/>:<Icon size={19}/>}</div><div className="quest-info"><b>{q.title}</b><small>{q.desc}</small><span className="quest-reward"><Coins size={12}/>{q.reward}</span></div><button className={done?'quest-check complete':'quest-check'} onClick={()=>completeQuest(q)} title={done?'Completed':'Complete quest'}>{done?<Check size={16}/>:<ChevronRight size={17}/>}</button></div>})}</div>
          <div className="daily-challenge"><div className="challenge-burst">✦</div><div><span>DAILY CHALLENGE</span><b>Rain or shine, keep exploring</b><small>Test your adaptability and earn bonus XP.</small></div><button onClick={()=>generate(true)} title="Activate simulated heavy rain"><CloudRain size={18}/></button></div>
        </div>
      </section>
      <section className="content-grid itinerary-grid" id="itinerary"><div className="panel itinerary-panel"><div className="panel-heading compact"><div><div className="section-kicker">04 / YOUR STORY, DAY BY DAY</div><h2>Adventure itinerary <span>🗺️</span></h2><p>{eventOn?'🌧️ Rain event simulation active — indoor alternatives shown.':'A flexible outline designed around your budget.'}</p></div><button className="small-outline" onClick={()=>generate(eventOn)}><RefreshCw size={14}/> Re-plan</button></div>
        {eventOn&&<div className="rain-banner"><CloudRain size={18}/><div><b>Heavy Rain — Simulation</b><small>Outdoor activities replaced with indoor or covered options. Not a live weather alert.</small></div><button onClick={()=>generate(false)}>Restore outdoor plan</button></div>}
        <div className="day-tabs">{(trip.itinerary||[]).map(d=><div className="day-tab" key={d.day}><span>DAY {d.day}</span><b>{d.title}</b><small><Clock3 size={12}/> {d.activities.length} stops</small></div>)}</div>
        <div className="itinerary-days">{(trip.itinerary||[]).slice(0,3).map(d=><div className="day-block" key={d.day}><div className="day-marker">{String(d.day).padStart(2,'0')}</div><div className="day-content"><div className="day-title"><div><b>{d.title}</b><small>{d.date}</small></div><span>{eventOn?'RAIN-SAFE ROUTE':'ADVENTURE ROUTE'}</span></div>{d.activities.map((a,i)=><div className="activity" key={a.id||a.title}><div className="activity-time">{a.time||'Anytime'}</div><div className="activity-dot"/><div className="activity-detail"><b>{a.title}</b><small>{a.kind||'Explore'} · {a.duration||'Flexible'}</small></div><div className="activity-cost">{a.cost===0?'FREE':money(a.cost)}</div></div>)}</div></div>)}</div>
        <div className="itinerary-bottom"><span><Check size={15}/> Flexible plan · Verify opening times before travel</span><button onClick={()=>{navigator.clipboard?.writeText((trip.itinerary||[]).map(d=>`${d.title}\n${d.activities.map(a=>`${a.time} ${a.title} (${money(a.cost)})`).join('\n')}`).join('\n\n'));setToast('Itinerary copied!')}}>Copy itinerary <ArrowUpRight size={14}/></button></div>
      </div>
      <div className="panel buddy-panel"><div className="buddy-header"><div className="buddy-orb">🤖<span/></div><div><span className="section-kicker">YOUR PERSONAL CO-PILOT</span><h2>Meet Questy</h2><small><i/> AI Travel Buddy · Demo mode</small></div><Sparkles className="buddy-spark"/></div><div className="buddy-intro"><b>Hey, explorer!</b><p>I'm here to help you spend less and discover more. Ask me anything about your trip.</p><div className="suggestions"><button onClick={()=>setMessage('How can I save money?')}>💸 Save money</button><button onClick={()=>setMessage('What if it rains?')}>🌧️ Rain plan</button><button onClick={()=>setMessage('Where can I find local food?')}>🍜 Local food</button></div></div><div className="chat-messages">{chat.slice(-4).map((c,i)=><div className={`chat-bubble ${c.from}`} key={i}>{c.from==='bot'&&<span>✦</span>}{c.text}</div>)}</div><form className="chat-form" onSubmit={sendChat}><input value={message} onChange={e=>setMessage(e.target.value)} placeholder="Ask your travel buddy…"/><button type="submit" aria-label="Send message"><Send size={16}/></button></form><div className="chat-foot"><span><span className="tiny-dot"/> Rule-based demo assistant</span><span>ESTIMATES ONLY</span></div></div></section>
      <footer className="footer"><div className="footer-brand"><Compass size={17}/> T-WORLD</div><span>Built for explorers on every budget ✦</span><span>Prototype · Sample data · No live bookings</span></footer>
    </main>
    {toast&&<div className="toast"><Check size={17}/>{toast}</div>}
  </div>
}
createRoot(document.getElementById('root')).render(<App/>)
