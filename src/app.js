// Connected to Turso DB through Vercel API


const state = {
  users: [],
  contactsByUser: new Map(),
  tokensByUser: new Map(),
  capabilitiesByUser: new Map(),
  specialtiesByUser: new Map(),
  selectedUserKey: null,
  search: "",
  accountFilter: "all",
};

const els = {
  searchInput: document.querySelector("#searchInput"),
  accountFilter: document.querySelector("#accountFilter"),
  refreshButton: document.querySelector("#refreshButton"),
  statusText: document.querySelector("#statusText"),
  visibleCount: document.querySelector("#visibleCount"),
  usersCount: document.querySelector("#usersCount"),
  contactsCount: document.querySelector("#contactsCount"),
  tokensCount: document.querySelector("#tokensCount"),
  specialtiesCount: document.querySelector("#specialtiesCount"),
  usersTable: document.querySelector("#usersTable"),
  emptyDetails: document.querySelector("#emptyDetails"),
  userDetails: document.querySelector("#userDetails"),
};

function safeText(value, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function normalizeSearch(value) {
  return safeText(value, "").toLowerCase().trim();
}

function parseAccountLabels(user, capability) {
  const value = Number(capability?.account_type ?? user?.account_type ?? 0);
  const labels = [];

  if (user?.system_role === "admin") labels.push("إدارة");
  if ((value & 1) === 1 || value === 0) labels.push("مشتري");
  if ((value & 2) === 2) labels.push("تاجر");
  if ((value & 4) === 4 || Number(capability?.can_deliver || user?.is_delivery_eligible || 0) === 1) {
    labels.push("توصيل");
  }

  return labels.length ? [...new Set(labels)] : ["غير محدد"];
}

function matchesAccountFilter(user) {
  if (state.accountFilter === "all") return true;

  const capability = state.capabilitiesByUser.get(user.user_key);
  const labels = parseAccountLabels(user, capability);
  const map = {
    buyer: "مشتري",
    merchant: "تاجر",
    delivery: "توصيل",
    admin: "إدارة",
  };

  return labels.includes(map[state.accountFilter]);
}

function getUserSearchText(user) {
  const contacts = state.contactsByUser.get(user.user_key) || [];
  const capability = state.capabilitiesByUser.get(user.user_key);
  const specialties = state.specialtiesByUser.get(user.user_key) || [];

  return normalizeSearch([
    user.username,
    user.phone,
    user.user_key,
    user.business_name,
    user.business_bio,
    user.business_category,
    user.business_sub_categories,
    user.system_role,
    contacts.map((item) => item.phone_number).join(" "),
    capability?.primary_main_category_id,
    specialties.map((item) => `${item.main_category_id} ${item.sub_category_id}`).join(" "),
  ].join(" "));
}

function getVisibleUsers() {
  return state.users.filter((user) => {
    const searchMatch = !state.search || getUserSearchText(user).includes(state.search);
    return searchMatch && matchesAccountFilter(user);
  });
}

function setLoading(isLoading) {
  els.refreshButton.disabled = isLoading;
  els.statusText.textContent = isLoading ? "جار تحميل البيانات..." : "تم تحميل البيانات";
}

function groupBy(rows, key) {
  const map = new Map();
  rows.forEach((row) => {
    const value = row[key];
    if (!value) return;
    if (!map.has(value)) map.set(value, []);
    map.get(value).push(row);
  });
  return map;
}

async function loadData() {
  setLoading(true);
  els.usersTable.innerHTML = "";
  els.userDetails.hidden = true;
  els.emptyDetails.hidden = false;

  try {
    const res = await fetch("/api/data");
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    const { users, contacts, tokens, capabilities, specialties } = data;

    state.users = users;
    state.contactsByUser = groupBy(contacts, "user_key");
    state.tokensByUser = groupBy(tokens, "user_key");
    state.capabilitiesByUser = new Map(capabilities.map((item) => [item.user_key, item]));
    state.specialtiesByUser = groupBy(specialties, "user_key");
    state.selectedUserKey = null;

    els.usersCount.textContent = users.length;
    els.contactsCount.textContent = contacts.length;
    els.tokensCount.textContent = tokens.length;
    els.specialtiesCount.textContent = specialties.length;

    render();
    setLoading(false);
  } catch (error) {
    setLoading(false);
    els.statusText.textContent = "تعذر تحميل البيانات";
    els.usersTable.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="error-box">${safeText(error.message)}</div>
        </td>
      </tr>
    `;
  }
}

function renderBadges(labels) {
  return labels.map((label) => `<span class="badge">${label}</span>`).join("");
}

function renderUsersTable() {
  const users = getVisibleUsers();
  els.visibleCount.textContent = `${users.length} ظاهر`;

  if (!users.length) {
    els.usersTable.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <strong>لا توجد نتائج</strong>
            <span>غيّر البحث أو الفلتر.</span>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  els.usersTable.innerHTML = users.map((user) => {
    const contacts = state.contactsByUser.get(user.user_key) || [];
    const capability = state.capabilitiesByUser.get(user.user_key);
    const specialties = state.specialtiesByUser.get(user.user_key) || [];
    const labels = parseAccountLabels(user, capability);
    const primaryContact = contacts.find((item) => Number(item.is_primary) === 1) || contacts[0];
    const selectedClass = user.user_key === state.selectedUserKey ? "is-selected" : "";

    return `
      <tr class="${selectedClass}" data-user-key="${safeText(user.user_key, "")}">
        <td>
          <div class="user-cell">
            <strong>${safeText(user.username)}</strong>
            <span class="subtext">${safeText(user.user_key)}</span>
          </div>
        </td>
        <td>${safeText(user.phone)}</td>
        <td>
          <div class="user-cell">
            <strong>${safeText(user.business_name)}</strong>
            <span class="subtext">${safeText(user.business_bio)}</span>
          </div>
        </td>
        <td><div class="chips">${renderBadges(labels)}</div></td>
        <td><span class="badge ${contacts.length ? "green" : "red"}">${contacts.length}</span> ${safeText(primaryContact?.phone_number, "")}</td>
        <td><span class="badge ${specialties.length ? "orange" : ""}">${specialties.length}</span></td>
        <td><button class="row-button" type="button" data-user-key="${safeText(user.user_key, "")}">عرض</button></td>
      </tr>
    `;
  }).join("");
}

function renderDetails() {
  const user = state.users.find((item) => item.user_key === state.selectedUserKey);
  if (!user) {
    els.emptyDetails.hidden = false;
    els.userDetails.hidden = true;
    els.userDetails.innerHTML = "";
    return;
  }

  const contacts = state.contactsByUser.get(user.user_key) || [];
  const tokens = state.tokensByUser.get(user.user_key) || [];
  const capability = state.capabilitiesByUser.get(user.user_key);
  const specialties = state.specialtiesByUser.get(user.user_key) || [];
  const labels = parseAccountLabels(user, capability);

  els.emptyDetails.hidden = true;
  els.userDetails.hidden = false;
  els.userDetails.innerHTML = `
    <div class="details-header">
      <h2>${safeText(user.username)}</h2>
      <span class="subtext">${safeText(user.user_key)}</span>
      <div class="chips">${renderBadges(labels)}</div>
    </div>

    <section class="details-section">
      <h3>البيانات الأساسية</h3>
      <div class="kv-list">
        <div><span>الهاتف</span><strong>${safeText(user.phone)}</strong></div>
        <div><span>النشاط</span><strong>${safeText(user.business_name)}</strong></div>
        <div><span>الدور</span><strong>${safeText(user.system_role)}</strong></div>
        <div><span>آخر دخول</span><strong>${safeText(user.last_login_at)}</strong></div>
        <div><span>تاريخ الإنشاء</span><strong>${safeText(user.created_at)}</strong></div>
      </div>
    </section>

    <section class="details-section">
      <h3>التواصل</h3>
      <div class="chips">
        ${contacts.length ? contacts.map((item) => `
          <span class="badge ${Number(item.has_whatsapp) ? "green" : ""}">
            ${safeText(item.phone_number)}${Number(item.is_primary) ? " / أساسي" : ""}
          </span>
        `).join("") : "<span class=\"badge red\">لا يوجد</span>"}
      </div>
    </section>

    <section class="details-section">
      <h3>القدرات</h3>
      <div class="kv-list">
        <div><span>التصنيف الرئيسي</span><strong>${safeText(capability?.primary_main_category_id)}</strong></div>
        <div><span>يستطيع التوصيل</span><strong>${Number(capability?.can_deliver || user.is_delivery_eligible || 0) ? "نعم" : "لا"}</strong></div>
        <div><span>تخصصات نشاط</span><strong>${Number(capability?.has_business_specialties || 0) ? "نعم" : "لا"}</strong></div>
        <div><span>تخصصات بيع</span><strong>${Number(capability?.has_sellable_specialties || 0) ? "نعم" : "لا"}</strong></div>
      </div>
    </section>

    <section class="details-section">
      <h3>التخصصات</h3>
      <div class="chips">
        ${specialties.length ? specialties.map((item) => `
          <span class="badge">${safeText(item.main_category_id)}${item.sub_category_id ? ` / ${safeText(item.sub_category_id)}` : ""}</span>
        `).join("") : "<span class=\"badge\">لا يوجد</span>"}
      </div>
    </section>

    <section class="details-section">
      <h3>الإشعارات</h3>
      <div class="kv-list">
        <div><span>عدد التوكنات</span><strong>${tokens.length}</strong></div>
        <div><span>المنصات</span><strong>${safeText([...new Set(tokens.map((item) => item.platform).filter(Boolean))].join(", "))}</strong></div>
      </div>
    </section>
  `;
}

function render() {
  renderUsersTable();
  renderDetails();
}

els.searchInput.addEventListener("input", (event) => {
  state.search = normalizeSearch(event.target.value);
  render();
});

els.accountFilter.addEventListener("change", (event) => {
  state.accountFilter = event.target.value;
  render();
});

els.refreshButton.addEventListener("click", loadData);

els.usersTable.addEventListener("click", (event) => {
  const target = event.target.closest("[data-user-key]");
  if (!target) return;
  state.selectedUserKey = target.dataset.userKey;
  render();
});

loadData();
