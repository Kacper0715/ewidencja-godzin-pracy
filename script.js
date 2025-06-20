document.addEventListener("DOMContentLoaded", function() {
    // ---- TRYB CIEMNY/JASNY ----
    (function() {
        function setTheme(dark) {
            if (dark) {
                document.body.classList.add('dark-mode');
                document.getElementById('theme-icon').setAttribute('data-feather', 'sun');
            } else {
                document.body.classList.remove('dark-mode');
                document.getElementById('theme-icon').setAttribute('data-feather', 'moon');
            }
            feather.replace();
        }
        let isDark = (localStorage.getItem('theme') === 'dark')
            || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setTheme(isDark);
        document.getElementById('theme-toggle').onclick = function() {
            isDark = !document.body.classList.contains('dark-mode');
            setTheme(isDark);
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        };
    })();

    // ---- WALUTA ----
    const MIN_RATE = 3;
    const MAX_RATE = 7;
    let exchangeRate = 4.30;
    const currencySelect = document.getElementById('currency-select');
    const currencySymbol = document.getElementById('currency-symbol');
    const summaryCurrency = document.getElementById('summary-currency');

    const showAlert = (msg, success = false) => {
        const banner = document.getElementById('alert-banner');
        banner.textContent = msg;
        banner.classList.toggle('success', success);
        banner.classList.add('show');
        setTimeout(() => banner.classList.remove('show'), 2300);
    };

    // Przywróć walutę z localStorage (lub domyślna PLN)
    const savedCurrency = localStorage.getItem('currency');
    if (savedCurrency) {
        currencySelect.value = savedCurrency;
    }
    updateCurrencySymbol();

    // Obsługa zmiany waluty
    currencySelect.addEventListener("change", function() {
        localStorage.setItem('currency', currencySelect.value);
        updateCurrencySymbol();
        renderEntries();
        renderSummary();
    });

    function updateCurrencySymbol() {
        if(currencySelect.value === "PLN") {
            currencySymbol.textContent = "zł";
            summaryCurrency.textContent = "zł";
        } else {
            currencySymbol.textContent = "€";
            summaryCurrency.textContent = "€";
        }
    }

    // Edycja kursu
    function showEditBox() {
        document.getElementById('eur-rate-edit-box').style.display = 'inline';
        document.getElementById('eur-rate-input').value = exchangeRate;
        document.getElementById('eur-rate-input').focus();
        document.getElementById('eur-rate-msg').style.display = 'none';
    }
    function hideEditBox() {
        document.getElementById('eur-rate-edit-box').style.display = 'none';
        document.getElementById('eur-rate-msg').style.display = 'none';
    }
    document.getElementById('eur-rate-edit').onclick = showEditBox;
    document.getElementById('eur-rate-input').addEventListener('keydown', function(e){
        if (e.key === "Enter") document.getElementById('eur-rate-save').click();
        if (e.key === "Escape") hideEditBox();
    });
    document.getElementById('eur-rate-save').onclick = function() {
        const val = parseFloat(document.getElementById('eur-rate-input').value.replace(',', '.'));
        if (isNaN(val) || val < MIN_RATE || val > MAX_RATE) {
            document.getElementById('eur-rate-msg').textContent = "Niepoprawny kurs!";
            document.getElementById('eur-rate-msg').style.display = 'inline';
            return;
        }
        exchangeRate = val;
        document.getElementById('eur-rate').textContent = exchangeRate.toFixed(2);
        hideEditBox();
        renderEntries();
        renderSummary();
        euroCalcReset();
    };

    // Pobieranie kursu z NBP
    async function getNBPRate() {
        document.getElementById('eur-rate-msg').textContent = "Pobieram kurs...";
        document.getElementById('eur-rate-msg').style.display = 'inline';
        try {
            const resp = await fetch("https://api.nbp.pl/api/exchangerates/rates/a/eur/?format=json");
            if (!resp.ok) throw new Error('Błąd pobierania kursu');
            const data = await resp.json();
            if (data && data.rates && data.rates[0] && data.rates[0].mid) {
                exchangeRate = parseFloat(data.rates[0].mid);
                document.getElementById('eur-rate').textContent = exchangeRate.toFixed(2);
                renderEntries();
                renderSummary();
                euroCalcReset();
                document.getElementById('eur-rate-msg').textContent = "Kurs zaktualizowany!";
                setTimeout(() => document.getElementById('eur-rate-msg').style.display = 'none', 1200);
            } else throw new Error('Brak danych');
        } catch (err) {
            document.getElementById('eur-rate-msg').textContent = "Błąd pobierania kursu z NBP!";
            setTimeout(() => document.getElementById('eur-rate-msg').style.display = 'none', 2500);
        }
        hideEditBox();
    }
    document.getElementById('eur-rate-nbp').onclick = getNBPRate;

    // Kalkulator PLN/EUR
    function euroCalcUpdate() {
        const plnToEur = document.getElementById('pln-to-eur');
        const eurFromPln = document.getElementById('eur-from-pln');
        const eurToPln = document.getElementById('eur-to-pln');
        const plnFromEur = document.getElementById('pln-from-eur');
        plnToEur.addEventListener('input', () => {
            const pln = parseFloat(plnToEur.value.replace(',', '.'));
            eurFromPln.value = (pln && exchangeRate ? (pln / exchangeRate).toFixed(2) : "");
            if (!plnToEur.value) eurFromPln.value = "";
        });
        eurFromPln.addEventListener('input', () => {
            const eur = parseFloat(eurFromPln.value.replace(',', '.'));
            plnToEur.value = (eur && exchangeRate ? (eur * exchangeRate).toFixed(2) : "");
            if (!eurFromPln.value) plnToEur.value = "";
        });
        eurToPln.addEventListener('input', () => {
            const eur = parseFloat(eurToPln.value.replace(',', '.'));
            plnFromEur.value = (eur && exchangeRate ? (eur * exchangeRate).toFixed(2) : "");
            if (!eurToPln.value) plnFromEur.value = "";
        });
        plnFromEur.addEventListener('input', () => {
            const pln = parseFloat(plnFromEur.value.replace(',', '.'));
            eurToPln.value = (pln && exchangeRate ? (pln / exchangeRate).toFixed(2) : "");
            if (!plnFromEur.value) eurToPln.value = "";
        });
    }
    euroCalcUpdate();

    function euroCalcReset() {
        ['pln-to-eur','eur-from-pln','eur-to-pln','pln-from-eur'].forEach(id=>{
            const el = document.getElementById(id);
            if(el) el.value = "";
        });
    }

    // LOCALSTORAGE
    let entries = [];
    function saveEntriesToStorage() {
        try {
            localStorage.setItem('work_entries_v1', JSON.stringify(entries));
        } catch (e) {}
    }
    function loadEntriesFromStorage() {
        try {
            const data = localStorage.getItem('work_entries_v1');
            if (data) entries = JSON.parse(data);
            else entries = [];
        } catch(e) {
            entries = [];
        }
    }
    loadEntriesFromStorage();

    // PROJEKTY
    let selectedProject = "Wszystkie";
    function getProjectList() {
        const map = {};
        entries.forEach(e => {
            if (!e.project) return;
            const lower = e.project.trim().toLowerCase();
            if (!(lower in map)) map[lower] = e.project.trim();
        });
        return Object.values(map);
    }
    function updateProjectDatalist() {
        const datalist = document.getElementById('project-datalist');
        const projects = getProjectList();
        datalist.innerHTML = projects.map(p => `<option value="${p}">`).join('');
    }

    // CUSTOM SELECT PROJECT
    let customSelectInited = false;
    function renderCustomProjectSelect() {
        const wrapper = document.getElementById('custom-select-wrapper');
        wrapper.innerHTML = `
            <span class="custom-select-label"><i data-feather="filter"></i> Wybierz projekt:</span>
            <div class="custom-select" id="custom-project-select">
                <div class="custom-select-selected" id="custom-selected" tabindex="0">${selectedProject}</div>
                <div class="custom-select-dropdown" id="custom-dropdown"></div>
            </div>
        `;
        const projects = ["Wszystkie"].concat(getProjectList());
        const select = wrapper.querySelector('#custom-project-select');
        const selectedDiv = wrapper.querySelector('#custom-selected');
        const dropdown = wrapper.querySelector('#custom-dropdown');
        dropdown.innerHTML = projects.map(p =>
            `<div class="custom-select-option${selectedProject===p?" selected":""}" data-value="${p}" tabindex="0">${p}</div>`
        ).join('');
        selectedDiv.textContent = selectedProject;

        select.classList.remove('open');
        selectedDiv.onclick = () => {
            select.classList.toggle('open');
            if (select.classList.contains('open')) {
                setTimeout(()=>dropdown.querySelector('.custom-select-option.selected')?.scrollIntoView({block:'nearest'}), 60);
            }
        };

        if (!customSelectInited) {
            document.addEventListener('click', function(e){
                const cs = document.getElementById('custom-project-select');
                if (cs && !cs.contains(e.target)) cs.classList.remove('open');
            });
            customSelectInited = true;
        }

        dropdown.querySelectorAll('.custom-select-option').forEach(opt => {
            opt.onclick = function() {
                selectedProject = this.getAttribute('data-value');
                localStorage.setItem('selectedProject', selectedProject);
                select.classList.remove('open');
                renderCustomProjectSelect();
                renderEntries();
                renderSummary();
            };
        });
        selectedDiv.onkeydown = function(e){
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                select.classList.add('open');
                dropdown.querySelector('.custom-select-option.selected')?.focus();
            }
        };
        dropdown.querySelectorAll('.custom-select-option').forEach(opt => {
            opt.onkeydown = function(e){
                if(e.key === 'Enter' || e.key === ' ') this.click();
                if(e.key === 'ArrowDown') {
                    let next = this.nextElementSibling;
                    if (next) next.focus();
                }
                if(e.key === 'ArrowUp') {
                    let prev = this.previousElementSibling;
                    if (prev) prev.focus();
                }
                if(e.key === 'Escape') select.classList.remove('open');
            };
        });
        feather.replace();
    }

    // Przywróć ostatni wybrany projekt
    const projectInStorage = localStorage.getItem('selectedProject');
    if (projectInStorage) selectedProject = projectInStorage;

    // FORMULARZ: uzupełnianie i zapisywanie wartości
    const formFields = ['date', 'project', 'start', 'end', 'rate'];
    formFields.forEach(field => {
        const saved = localStorage.getItem('form_' + field);
        if (saved && document.getElementById(field)) {
            document.getElementById(field).value = saved;
        }
    });
    formFields.forEach(field => {
        const input = document.getElementById(field);
        if (input) {
            input.addEventListener('input', () => {
                localStorage.setItem('form_' + field, input.value);
            });
        }
    });

    const dateInput = document.getElementById('date');
    if (!dateInput.value) dateInput.value = new Date().toISOString().split('T')[0];
    if (!document.getElementById('start').value) document.getElementById('start').value = "08:00";
    if (!document.getElementById('end').value) document.getElementById('end').value = "16:00";
    document.getElementById('start').focus();
    document.getElementById('rate').addEventListener('wheel', function() {
        this.blur();
    });

    // LOGIKA APLIKACJI
    let editIndex = null;
    function countHours(start, end) {
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        let startMins = sh * 60 + sm;
        let endMins = eh * 60 + em;
        let diff = endMins - startMins;
        if (diff < 0) diff += 24 * 60;
        return +(diff / 60).toFixed(2);
    }

    function deleteEntry(index) {
        index = parseInt(index);
        if (isNaN(index) || index < 0 || index >= entries.length) return;
        const row = document.querySelector(`tr[data-edit-index="${index}"]`);
        if (row) {
            row.classList.add('entry-removing');
            setTimeout(() => {
                entries.splice(index, 1);
                saveEntriesToStorage();
                updateProjectDatalist();
                renderCustomProjectSelect();
                renderEntries();
                renderSummary();
            }, 250);
        } else {
            entries.splice(index, 1);
            saveEntriesToStorage();
            updateProjectDatalist();
            renderCustomProjectSelect();
            renderEntries();
            renderSummary();
        }
    }

    function renderSummary() {
        let totalHours = 0;
        let totalPay = 0;
        let cur = currencySelect.value;
        const filteredEntries = selectedProject === "Wszystkie"
            ? entries
            : entries.filter(e => (e.project || "").toLowerCase() === selectedProject.toLowerCase());
        filteredEntries.forEach(entry => {
            let pay = entry.hours * entry.rate;
            if (entry.currency !== cur) {
                if (cur === "EUR" && entry.currency === "PLN") {
                    pay = pay / exchangeRate;
                }
                if (cur === "PLN" && entry.currency === "EUR") {
                    pay = pay * exchangeRate;
                }
            }
            totalHours += entry.hours;
            totalPay += pay;
        });
        document.getElementById('total-hours').textContent = totalHours.toFixed(2);
        document.getElementById('total-pay').textContent = totalPay.toFixed(2);
    }

    function renderEntries() {
        const entriesDiv = document.getElementById('entries');
        const cur = currencySelect.value;
        const filteredEntries = selectedProject === "Wszystkie"
            ? entries
            : entries.filter(e => (e.project || "").toLowerCase() === selectedProject.toLowerCase());
        if (filteredEntries.length === 0) {
            entriesDiv.innerHTML = '<div class="empty-list">Brak wpisów. Dodaj swój pierwszy dzień pracy!</div>';
            return;
        }
        let html = `<table class="entries-table">
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Projekt</th>
                    <th>Start</th>
                    <th>Koniec</th>
                    <th>Stawka</th>
                    <th>Liczba godzin</th>
                    <th>Zarobek</th>
                    <th>Usuń</th>
                </tr>
            </thead>
            <tbody>
        `;
        filteredEntries.forEach((entry, i) => {
            let dailyPay = entry.hours * entry.rate;
            let rateDisplay = entry.rate;
            let symbol = entry.currency === "EUR" ? "€" : "zł";
            if (entry.currency !== cur) {
                if (cur === "EUR" && entry.currency === "PLN") {
                    dailyPay = dailyPay / exchangeRate;
                    rateDisplay = (entry.rate / exchangeRate).toFixed(2);
                    symbol = "€";
                }
                if (cur === "PLN" && entry.currency === "EUR") {
                    dailyPay = dailyPay * exchangeRate;
                    rateDisplay = (entry.rate * exchangeRate).toFixed(2);
                    symbol = "zł";
                }
            }
            html += `<tr data-edit-index="${i}" style="cursor:pointer;">
                <td>${entry.date}</td>
                <td>${entry.project || '-'}</td>
                <td>${entry.start}</td>
                <td>${entry.end}</td>
                <td>${rateDisplay} ${symbol}/h</td>
                <td>${entry.hours}</td>
                <td>${dailyPay.toFixed(2)} ${symbol}</td>
                <td>
                    <button class="delete-btn" title="Usuń wpis" data-index="${i}" onclick="event.stopPropagation();"><i data-feather="trash-2"></i></button>
                </td>
            </tr>`;
        });
        html += '</tbody></table>';
        entriesDiv.innerHTML = html;
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = this.getAttribute('data-index');
                deleteEntry(index);
            });
        });
        document.querySelectorAll('tr[data-edit-index]').forEach(row => {
            row.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-edit-index'));
                openEditModal(index);
            });
        });
        feather.replace();
    }

    // MODAL EDYCJI
    function openEditModal(index) {
        editIndex = index;
        const entry = entries[index];
        document.getElementById('edit-date').value = entry.date;
        document.getElementById('edit-project').value = entry.project || '';
        document.getElementById('edit-start').value = entry.start;
        document.getElementById('edit-end').value = entry.end;
        document.getElementById('edit-rate').value = entry.rate;
        document.getElementById('edit-currency').textContent = entry.currency === "EUR" ? "€" : "zł";
        document.getElementById('edit-modal').classList.add('active');
        document.body.classList.add('modal-open');
        requestAnimationFrame(() => document.getElementById('edit-date').focus());
    }
    function closeEditModal() {
        document.getElementById('edit-modal').classList.remove('active');
        document.body.classList.remove('modal-open');
        editIndex = null;
    }
    document.getElementById('close-edit-modal').onclick = closeEditModal;
    document.getElementById('edit-modal-overlay').addEventListener('click', function(e){
        if (e.target === this) closeEditModal();
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.getElementById('edit-modal').classList.contains('active')) {
            closeEditModal();
        }
    });

    document.getElementById('edit-form').onsubmit = function(e) {
        e.preventDefault();
        if(editIndex !== null) {
            let inputProject = document.getElementById('edit-project').value.trim();
            if (inputProject.length < 2) {
                showAlert("Nazwa projektu musi mieć minimum 2 znaki.", false);
                return;
            }
            const projectList = getProjectList();
            const existing = projectList.find(p => p.toLowerCase() === inputProject.toLowerCase());
            if (existing) inputProject = existing;
            else inputProject = inputProject.charAt(0).toUpperCase() + inputProject.slice(1);
            const start = document.getElementById('edit-start').value;
            const end = document.getElementById('edit-end').value;
            if (start >= end) {
                showAlert("Godzina zakończenia musi być po godzinie rozpoczęcia!", false);
                return;
            }
            let rate = parseFloat(document.getElementById('edit-rate').value);
            if (isNaN(rate) || rate < 0 || rate > 500) {
                showAlert("Stawka musi być liczbą z zakresu 0-500.", false);
                return;
            }
            entries[editIndex].date = document.getElementById('edit-date').value;
            entries[editIndex].project = inputProject;
            entries[editIndex].start = start;
            entries[editIndex].end = end;
            entries[editIndex].rate = rate.toFixed(2);
            entries[editIndex].hours = countHours(
                entries[editIndex].start,
                entries[editIndex].end
            );
            saveEntriesToStorage();
            updateProjectDatalist();
            renderCustomProjectSelect();
            renderEntries();
            renderSummary();
            closeEditModal();
        }
    };

    // FORM SUBMIT
    const form = document.getElementById('work-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        let inputProject = document.getElementById('project').value.trim();
        if (inputProject.length < 2) {
            showAlert("Nazwa projektu musi mieć minimum 2 znaki.", false);
            return;
        }
        const projectList = getProjectList();
        const existing = projectList.find(p => p.toLowerCase() === inputProject.toLowerCase());
        if (existing) inputProject = existing;
        else inputProject = inputProject.charAt(0).toUpperCase() + inputProject.slice(1);
        const date = document.getElementById('date').value;
        const start = document.getElementById('start').value;
        const end = document.getElementById('end').value;
        let rate = parseFloat(document.getElementById('rate').value);
        const cur = currencySelect.value;
        if (!date || !start || !end || isNaN(rate) || !inputProject) {
            showAlert("Uzupełnij wszystkie pola poprawnie!", false);
            return;
        }
        if (start >= end) {
            showAlert("Godzina zakończenia musi być po godzinie rozpoczęcia!", false);
            return;
        }
        if (rate < 0 || rate > 500) {
            showAlert("Stawka musi być z zakresu 0-500.", false);
            return;
        }
        const hours = countHours(start, end);
        entries.push({
            date,
            project: inputProject,
            start,
            end,
            rate: rate.toFixed(2),
            hours,
            currency: cur
        });
        saveEntriesToStorage();
        updateProjectDatalist();
        renderCustomProjectSelect();
        renderEntries();
        renderSummary();
        form.reset();
        formFields.forEach(field => localStorage.removeItem('form_' + field));
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
        document.getElementById('start').value = "08:00";
        document.getElementById('end').value = "16:00";
        document.getElementById('start').focus();
        const btn = document.getElementById('add-btn');
        btn.classList.add('success');
        setTimeout(() => btn.classList.remove('success'), 900);
    });

    // INICJALIZACJA KOŃCOWA
    renderEntries();
    renderSummary();
    updateProjectDatalist();
    renderCustomProjectSelect();
    feather.replace();
});
