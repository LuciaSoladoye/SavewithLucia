let groups = [];
let active = null;
let isAdmin = false;
const wrap = document.getElementById('groups');

const { collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc, increment } = window.fb;
const groupsRef = collection(window.db, "groups");

// Load live groups
onSnapshot(groupsRef, (snap)=>{
  groups = [];
  snap.forEach(d=> groups.push({id:d.id, ...d.data()}));
  draw();
});

function draw(){
  wrap.innerHTML='';
  if(!groups.length){
    wrap.innerHTML='<p style="text-align:center;padding:20px">No groups yet. Click Admin to create your first group.</p>';
    return;
  }
  ['Daily','Weekly','Monthly'].forEach(t=>{
    let list = groups.filter(g=>g.type===t);
    if(!list.length) return;
    wrap.innerHTML+=`<h3 class="title">${t} Plans</h3><div class="grid" id="g-${t}"></div>`;
    let grid=document.getElementById(`g-${t}`);
    list.forEach(g=>{
      let left=g.slots-g.joined;
      grid.innerHTML+=`
        <div class="card">
          <h3>${g.title}</h3>
          <p>${g.desc}</p>
          <span class="badge">${left} slots left</span>
          <button onclick="join('${g.id}')" ${left<=0?'disabled':''}>${left<=0?'Full':'Join Group'}</button>
          ${isAdmin?`<button onclick="del('${g.id}')" style="background:#eee;color:#800020;margin-top:5px">Delete</button>`:''}
        </div>`;
    });
  });
}

// Open Join Modal
window.join=(id)=>{
  active=groups.find(g=>g.id===id);
  document.getElementById('mTitle').innerText=active.title;
  document.getElementById('joinModal').style.display='flex';
}

// Delete Group
window.del=async(id)=>{
  if(confirm('Delete this group live for everyone?')){
    await deleteDoc(doc(window.db,"groups",id));
  }
}

// Close Modals
window.closeModal=(id)=> document.getElementById(id).style.display='none';

// FIXED: Open WhatsApp FIRST
document.getElementById('joinPay').onclick=async()=>{
  let name=document.getElementById('cName').value;
  let phone=document.getElementById('cPhone').value;
  if(!name||!phone) return alert('Put name and number');

  let msg=`Hi Lucia, I want to join ${active.title}. Name: ${name}, Phone: ${phone}`;
  // This will ALWAYS open your WhatsApp now
  window.open(`https://wa.me/2347042877566?text=${encodeURIComponent(msg)}`,'_blank');
  
  closeModal('joinModal');
  
  try{
    await updateDoc(doc(window.db,"groups",active.id), {joined: increment(1)});
  }catch(e){
    console.log("Firebase error", e);
  }
}

// Admin Login
document.getElementById('adminBtn').onclick=()=>{
  let p=prompt('Admin password:');
  if(p==='lucia123'){
    isAdmin=true;
    document.getElementById('createBtn').style.display='inline-block';
    draw();
    alert('Admin LIVE mode on!');
  } else {
    alert('Wrong password');
  }
}

// Create Modal Open
document.getElementById('createBtn').onclick=()=> document.getElementById('createModal').style.display='flex';

// Save New Group
document.getElementById('saveBtn').onclick=async()=>{
  let title=document.getElementById('nTitle').value;
  let desc=document.getElementById('nDesc').value;
  let type=document.getElementById('nType').value;
  let slots=parseInt(document.getElementById('nSlots').value);
  if(!title||!slots) return alert('Fill title and slots');
  await addDoc(groupsRef, {type,title,desc,slots,joined:0});
  closeModal('createModal');
  document.getElementById('nTitle').value='';
  document.getElementById('nDesc').value='';
  document.getElementById('nSlots').value='';
}
