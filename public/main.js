const form = document.getElementById('ceremony-form');
const typeSelect = document.getElementById('type');
const bWrap = document.getElementById('b-wrap');


function updateUI() {
const type = typeSelect.value;
const isFiction = type === 'fictional-character';
bWrap.querySelector('label').textContent = isFiction ? 'Character Name' : 'Partner or Character Name';
}


typeSelect.addEventListener('change', updateUI);
updateUI();


form.addEventListener('submit', async (e) => {
e.preventDefault();
const data = Object.fromEntries(new FormData(form).entries());


// time zone best effort if empty
if (!data.timezone) {
try { data.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch {}
}


const res = await fetch('/api/ceremonies', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(data)
});
const json = await res.json();


if (json.error) {
alert(json.error);
return;
}


if (json.free) {
window.location.href = json.certificate_url;
} else if (json.checkout_url) {
window.location.href = json.checkout_url;
} else {
alert('Unexpected response.');
}
});
