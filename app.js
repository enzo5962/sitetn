const supabaseUrl =
'https://xupbhyigzdtfjoajlwef.supabase.co';

const supabaseKey =
'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1cGJoeWlnemR0ZmpvYWpsd2VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMjM5ODIsImV4cCI6MjA5NDc5OTk4Mn0.AFVAo1qddsQ-ZsQIQ6g-4kaxsvnk7heZlwtXB5Cd4Zs';

const supabaseClient =
window.supabase.createClient(
    supabaseUrl,
    supabaseKey
);

// =========================
// VARIABLES
// =========================

let isFormateurConnected = false;

let isDirectionConnected = false;

let directionUser = '';

let formateurUser = '';


// =========================
// DATE +2H
// =========================

function formatDateFR(dateString) {

    const date =
    new Date(dateString);

    date.setHours(
        date.getHours() + 2
    );

    return date.toLocaleString(
        'fr-FR'
    );
}


// =========================
// MENUS
// =========================

function showFormateur() {

    document.getElementById('loginBox')
        .classList.remove('hidden');

    document.getElementById('directionBox')
        .classList.add('hidden');

    document.getElementById('candidatBox')
        .classList.add('hidden');

    if(!isFormateurConnected) {

        document.getElementById('formateurBox')
            .classList.add('hidden');
    }
}

function showDirection() {

    document.getElementById('directionBox')
        .classList.remove('hidden');

    document.getElementById('loginBox')
        .classList.add('hidden');

    document.getElementById('candidatBox')
        .classList.add('hidden');

    if(!isDirectionConnected) {

        document.getElementById('listeFormateurs')
            .innerHTML = '';
    }
}

function showCandidat() {

    document.getElementById('candidatBox')
        .classList.remove('hidden');

    document.getElementById('directionBox')
        .classList.add('hidden');

    document.getElementById('loginBox')
        .classList.add('hidden');

    chargerResultatsPublic();
}


// =========================
// CREER FORMATEUR
// =========================

async function creerCompteFormateur() {

    const username =
    document.getElementById('username').value;

    const password =
    document.getElementById('password').value;

    await supabaseClient
        .from('formateurs')
        .insert([
            {
                username,
                password,
                valide: false
            }
        ]);

    alert(
        'Compte envoyé à la direction'
    );
}


// =========================
// LOGIN FORMATEUR
// =========================

async function login() {

    const username =
    document.getElementById('username').value;

    const password =
    document.getElementById('password').value;

    const { data, error } =
    await supabaseClient
        .from('formateurs')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .eq('valide', true)
        .single();

    if(error || !data) {

        alert('Compte non validé');

        return;
    }

    isFormateurConnected = true;

    formateurUser = username;

    document.getElementById('loginBox')
        .classList.add('hidden');

    document.getElementById('formateurBox')
        .classList.remove('hidden');

    chargerCandidats();

    limiterNotes();

    await ajouterLogFormateur(
        'Connexion du formateur'
    );
}


// =========================
// LOGIN DIRECTION
// =========================

async function loginDirection() {

    const username =
    document.getElementById('directionUsername').value;

    const password =
    document.getElementById('directionPassword').value;

    const { data, error } =
    await supabaseClient
        .from('direction')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

    if(error || !data) {

        alert('Connexion refusée');

        return;
    }

    isDirectionConnected = true;

    directionUser = username;

    document.getElementById('directionContent')
        .classList.remove('hidden');

    chargerFormateurs();

    chargerParametres();

    chargerLogs();

    await ajouterLog(
        'Connexion direction'
    );
}


// =========================
// AJOUT CANDIDAT
// =========================

async function ajouterCandidat() {

    const nom =
    document.getElementById('nomCandidat').value;

    await supabaseClient
        .from('candidats')
        .insert([{ nom }]);

    await ajouterLogFormateur(
        `Ajout du candidat ${nom}`
    );

    alert('Candidat ajouté');

    chargerCandidats();
}


// =========================
// CHARGER CANDIDATS
// =========================

async function chargerCandidats() {

    const select =
    document.getElementById('candidatSelect');

    select.innerHTML = '';

    const { data } =
    await supabaseClient
        .from('candidats')
        .select('*');

    data.forEach(candidat => {

        const option =
        document.createElement('option');

        option.value = candidat.id;

        option.textContent = candidat.nom;

        select.appendChild(option);
    });
}


// =========================
// LIMITER NOTES
// =========================

async function limiterNotes() {

    const { data } =
    await supabaseClient
        .from('parametres')
        .select('*')
        .single();

    const champs = [
        {
            id: 'cas1',
            max: data.max_cas1
        },
        {
            id: 'cas2',
            max: data.max_cas2
        },
        {
            id: 'cas3',
            max: data.max_cas3
        },
        {
            id: 'cas4',
            max: data.max_cas4
        },
        {
            id: 'cas5',
            max: data.max_cas5
        }
    ];

    champs.forEach(champ => {

        const input =
        document.getElementById(champ.id);

        input.addEventListener('input', () => {

            let valeur =
            Number(input.value);

            if(valeur > champ.max) {

                input.value = champ.max;
            }

            if(valeur < 0) {

                input.value = 0;
            }
        });
    });
}


// =========================
// STATUT
// =========================

async function getStatut(total) {

    const { data } =
    await supabaseClient
        .from('parametres')
        .select('*')
        .single();

    if(total >= data.seuil_accepte) {

        return 'Accepté';
    }

    if(total >= data.seuil_rattrapage) {

        return 'Rattrapage';
    }

    return 'Ajourné';
}


// =========================
// ENREGISTRER NOTES
// =========================

async function enregistrerNotes() {

    const candidat_id =
    document.getElementById('candidatSelect').value;

    const cas1 =
    Number(document.getElementById('cas1').value);

    const cas2 =
    Number(document.getElementById('cas2').value);

    const cas3 =
    Number(document.getElementById('cas3').value);

    const cas4 =
    Number(document.getElementById('cas4').value);

    const cas5 =
    Number(document.getElementById('cas5').value);

    const commentaire =
    document.getElementById('commentaire').value;

    const publicationDate =
    document.getElementById('datePublication').value;

    const total =
    cas1 + cas2 + cas3 + cas4 + cas5;

    const statut =
    await getStatut(total);

    await supabaseClient
        .from('notes')
        .insert([
            {
                candidat_id,
                cas1,
                cas2,
                cas3,
                cas4,
                cas5,
                moyenne: total,
                statut,
                commentaire,
                date_publication:
                    publicationDate
            }
        ]);

    const { data: candidatData } =
    await supabaseClient
        .from('candidats')
        .select('nom')
        .eq('id', candidat_id)
        .single();

    await ajouterLogFormateur(
        `Ajout des notes du candidat ${candidatData.nom}`
    );

    chargerLogs();

    alert('Notes enregistrées');
}


// =========================
// RESULTATS PUBLICS
// =========================

async function chargerResultatsPublic() {

    const tbody =
    document.getElementById('publicResults');

    tbody.innerHTML = '';

    const nowDate =
    new Date();

    nowDate.setHours(
        nowDate.getHours() + 2
    );

    const now =
    nowDate.toISOString();

    const { data: notes } =
    await supabaseClient
        .from('notes')
        .select(`
            *,
            candidats(nom)
        `)
        .lte('date_publication', now);

    const { data: parametres } =
    await supabaseClient
        .from('parametres')
        .select('*')
        .single();

    notes.forEach(note => {

        tbody.innerHTML += `

            <tr>

                <td>${note.candidats.nom}</td>

                <td>${note.cas1} / ${parametres.max_cas1}</td>

                <td>${note.cas2} / ${parametres.max_cas2}</td>

                <td>${note.cas3} / ${parametres.max_cas3}</td>

                <td>${note.cas4} / ${parametres.max_cas4}</td>

                <td>${note.cas5} / ${parametres.max_cas5}</td>

                <td>${note.moyenne}</td>

                <td>${note.statut}</td>

                <td>${note.commentaire}</td>

            </tr>
        `;
    });
}


// =========================
// PUBLIER NOTES
// =========================

async function publierToutesNotes() {

    const nowDate =
    new Date();

    nowDate.setHours(
        nowDate.getHours() + 2
    );

    const now =
    nowDate.toISOString();

    await supabaseClient
        .from('notes')
        .update({
            date_publication: now
        })
        .gt(
            'date_publication',
            now
        );

    await ajouterLog(
        'Publication de toutes les notes'
    );

    chargerLogs();

    alert('Toutes les notes publiées');
}


// =========================
// CHARGER FORMATEURS
// =========================

async function chargerFormateurs() {

    const div =
    document.getElementById('listeFormateurs');

    div.innerHTML = '';

    const { data } =
    await supabaseClient
        .from('formateurs')
        .select('*')
        .eq('valide', false);

    data.forEach(formateur => {

        div.innerHTML += `

            <p>

                ${formateur.username}

                <button
                    onclick="validerFormateur(${formateur.id})"
                >

                    Valider

                </button>

            </p>
        `;
    });
}


// =========================
// VALIDER FORMATEUR
// =========================

async function validerFormateur(id) {

    await supabaseClient
        .from('formateurs')
        .update({
            valide: true
        })
        .eq('id', id);

    await ajouterLog(
        `Validation du formateur ID ${id}`
    );

    chargerLogs();

    chargerFormateurs();
}


// =========================
// SAUVEGARDER PARAMETRES
// =========================

async function sauvegarderParametres() {

    await supabaseClient
        .from('parametres')
        .update({

            max_cas1:
            document.getElementById('max1').value,

            max_cas2:
            document.getElementById('max2').value,

            max_cas3:
            document.getElementById('max3').value,

            max_cas4:
            document.getElementById('max4').value,

            max_cas5:
            document.getElementById('max5').value,

            seuil_accepte:
            document.getElementById('seuilAccepte').value,

            seuil_rattrapage:
            document.getElementById('seuilRattrapage').value

        })
        .eq('id', 1);

    await ajouterLog(
        'Modification des paramètres'
    );

    chargerLogs();

    alert('Paramètres sauvegardés');
}


// =========================
// CHARGER PARAMETRES
// =========================

async function chargerParametres() {

    const { data } =
    await supabaseClient
        .from('parametres')
        .select('*')
        .single();

    document.getElementById('max1').value =
    data.max_cas1;

    document.getElementById('max2').value =
    data.max_cas2;

    document.getElementById('max3').value =
    data.max_cas3;

    document.getElementById('max4').value =
    data.max_cas4;

    document.getElementById('max5').value =
    data.max_cas5;

    document.getElementById('seuilAccepte').value =
    data.seuil_accepte;

    document.getElementById('seuilRattrapage').value =
    data.seuil_rattrapage;
}


// =========================
// LOG DIRECTION
// =========================

async function ajouterLog(action) {

    await supabaseClient
        .from('logs')
        .insert([
            {
                utilisateur:
                    `[DIR] ${directionUser}`,

                action: action
            }
        ]);
}


// =========================
// LOG FORMATEUR
// =========================

async function ajouterLogFormateur(action) {

    await supabaseClient
        .from('logs')
        .insert([
            {
                utilisateur:
                    `[FORMA] ${formateurUser}`,

                action: action
            }
        ]);
}


// =========================
// CHARGER LOGS
// =========================

async function chargerLogs(utilisateurFiltre = null) {

    const logsBox =
    document.getElementById('logsBox');

    const tabsBox =
    document.getElementById('logsTabs');

    logsBox.innerHTML = '';

    const { data } =
    await supabaseClient
        .from('logs')
        .select('*')
        .order('date_action', {
            ascending: false
        });

    const utilisateurs =
    [...new Set(
        data.map(log => log.utilisateur)
    )];

    tabsBox.innerHTML = '';

    tabsBox.innerHTML += `

        <button
            class="log-tab"
            onclick="chargerLogs()"
        >
            Tous
        </button>
    `;

    utilisateurs.forEach(user => {

        tabsBox.innerHTML += `

            <button
                class="log-tab"
                onclick="chargerLogs('${user}')"
            >
                ${user}
            </button>
        `;
    });

    const logsFiltres =
    utilisateurFiltre
    ? data.filter(
        log =>
        log.utilisateur === utilisateurFiltre
      )
    : data;

    logsFiltres.forEach(log => {

        const dateFormatee =
        formatDateFR(
            log.date_action
        );

        logsBox.innerHTML += `

            <div class="log-item">

                <strong>
                    ${log.utilisateur}
                </strong>

                <br>

                ${log.action}

                <br>

                <small>
                    ${dateFormatee}
                </small>

            </div>

        `;
    });
}