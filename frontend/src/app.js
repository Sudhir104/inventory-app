const { useState, useEffect, useCallback } = React;
const API = "https://inventory-app-eac7.onrender.com";

// ── helpers ──────────────────────────────────────────────────────────────────

function api(path, opts = {}) {
  const token = localStorage.getItem("token");
  return fetch(API + path, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {})
    },
    ...opts
  }).then(async r => {
    const data = await r.json();
    if (!r.ok) throw new Error(data.detail || data.message || "Request failed");
    return data;
  });
}

function fmt(n) {
  return Number(n).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

// ── Auth pages ────────────────────────────────────────────────────────────────

function AuthPage({ onLogin }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setErr(""); }

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setErr("");
    try {
      const data = tab === "login"
        ? await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: form.email, password: form.password }) })
        : await api("/api/auth/signup", { method: "POST", body: JSON.stringify(form) });
      localStorage.setItem("token", data.token);
      onLogin(data.user);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    React.createElement("div", { className: "auth-page" },
      React.createElement("div", { className: "auth-panel" },
        React.createElement("div", null,
          React.createElement("p", { className: "eyebrow" }, "Full-Stack Assignment"),
          React.createElement("h1", null, "Inventory & Order Manager"),
          React.createElement("p", { className: "muted", style: { margin: "10px 0 0", lineHeight: 1.6 } },
            "Manage products, customers, orders and track inventory in one place."
          )
        ),
        React.createElement("div", null,
          React.createElement("div", { className: "tabs" },
            React.createElement("button", { className: tab === "login" ? "active" : "", onClick: () => setTab("login") }, "Login"),
            React.createElement("button", { className: tab === "signup" ? "active" : "", onClick: () => setTab("signup") }, "Sign up")
          ),
          React.createElement("form", { className: "auth-form", onSubmit: submit },
            tab === "signup" && React.createElement("label", null, "Name",
              React.createElement("input", { value: form.name, onChange: e => set("name", e.target.value), placeholder: "Your name", required: true })
            ),
            React.createElement("label", null, "Email",
              React.createElement("input", { type: "email", value: form.email, onChange: e => set("email", e.target.value), placeholder: "you@example.com", required: true })
            ),
            React.createElement("label", null, "Password",
              React.createElement("input", { type: "password", value: form.password, onChange: e => set("password", e.target.value), placeholder: "••••••••", required: true })
            ),
            err && React.createElement("p", { className: "error" }, err),
            React.createElement("button", { type: "submit", className: "primary", disabled: loading },
              loading ? "Please wait…" : tab === "login" ? "Login" : "Create account"
            )
          )
        )
      )
    )
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({ page, setPage, user, onLogout }) {
  const links = [
    { id: "dashboard", label: "Dashboard" },
    { id: "products", label: "Products" },
    { id: "customers", label: "Customers" },
    { id: "orders", label: "Orders" }
  ];
  return React.createElement("div", { className: "sidebar" },
    React.createElement("div", { className: "sidebar-title" },
      React.createElement("p", { className: "eyebrow" }, "Inventory"),
      React.createElement("h2", null, "Order Manager")
    ),
    links.map(l =>
      React.createElement("button", { key: l.id, className: "nav-btn " + (page === l.id ? "active" : ""), onClick: () => setPage(l.id) }, l.label)
    ),
    React.createElement("div", { className: "sidebar-bottom" },
      React.createElement("span", null, user.name),
      React.createElement("button", { onClick: onLogout, style: { width: "100%" } }, "Logout")
    )
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api("/api/orders/dashboard").then(setData).catch(() => {});
  }, []);

  if (!data) return React.createElement("p", { className: "muted" }, "Loading…");

  const statusOrder = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

  return React.createElement("div", null,
    React.createElement("div", { className: "page-head" },
      React.createElement("h2", null, "Dashboard")
    ),
    React.createElement("div", { className: "stats-grid" },
      React.createElement("div", { className: "stat blue" }, React.createElement("span", null, "Total Orders"), React.createElement("strong", null, data.total_orders)),
      React.createElement("div", { className: "stat green" }, React.createElement("span", null, "Revenue"), React.createElement("strong", null, fmt(data.total_revenue))),
      React.createElement("div", { className: "stat" }, React.createElement("span", null, "Products"), React.createElement("strong", null, data.total_products)),
      React.createElement("div", { className: "stat" }, React.createElement("span", null, "Customers"), React.createElement("strong", null, data.total_customers))
    ),
    React.createElement("div", { className: "panel" },
      React.createElement("div", { className: "panel-head" },
        React.createElement("h3", null, "Orders by Status")
      ),
      React.createElement("table", null,
        React.createElement("thead", null,
          React.createElement("tr", null,
            React.createElement("th", null, "Status"),
            React.createElement("th", null, "Count")
          )
        ),
        React.createElement("tbody", null,
          statusOrder.map(s =>
            React.createElement("tr", { key: s },
              React.createElement("td", null, React.createElement("span", { className: "badge " + s }, s)),
              React.createElement("td", null, data.orders_by_status[s] || 0)
            )
          )
        )
      )
    ),
    data.low_stock.length > 0 && React.createElement("div", { className: "panel low-stock-table" },
      React.createElement("div", { className: "panel-head" },
        React.createElement("h3", null, "⚠ Low Stock Alerts")
      ),
      React.createElement("table", null,
        React.createElement("thead", null,
          React.createElement("tr", null,
            React.createElement("th", null, "Product"),
            React.createElement("th", null, "SKU"),
            React.createElement("th", null, "Stock")
          )
        ),
        React.createElement("tbody", null,
          data.low_stock.map(p =>
            React.createElement("tr", { key: p.id },
              React.createElement("td", null, p.name),
              React.createElement("td", null, React.createElement("code", null, p.sku)),
              React.createElement("td", null, React.createElement("span", { className: "badge low" }, p.stock + " left"))
            )
          )
        )
      )
    )
  );
}

// ── Products ──────────────────────────────────────────────────────────────────

function ProductModal({ product, onClose, onSaved }) {
  const blank = { name: "", sku: "", description: "", price: "", stock: "", category: "" };
  const [form, setForm] = useState(product ? { ...product, price: product.price, stock: product.stock } : blank);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setErr(""); }

  async function save(e) {
    e.preventDefault();
    setSaving(true); setErr("");
    try {
      const body = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) };
      const data = product
        ? await api("/api/products/" + product.id, { method: "PUT", body: JSON.stringify(body) })
        : await api("/api/products", { method: "POST", body: JSON.stringify(body) });
      onSaved(data.product);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return React.createElement("div", { className: "modal-overlay", onClick: e => e.target === e.currentTarget && onClose() },
    React.createElement("div", { className: "modal" },
      React.createElement("h3", null, product ? "Edit Product" : "Add Product"),
      React.createElement("form", { className: "stack-form", onSubmit: save },
        React.createElement("label", null, "Product Name",
          React.createElement("input", { value: form.name, onChange: e => set("name", e.target.value), placeholder: "e.g. Wireless Keyboard", required: true })
        ),
        React.createElement("div", { className: "form-row" },
          React.createElement("label", null, "SKU",
            React.createElement("input", { value: form.sku, onChange: e => set("sku", e.target.value), placeholder: "e.g. WK-001", required: true })
          ),
          React.createElement("label", null, "Category",
            React.createElement("input", { value: form.category, onChange: e => set("category", e.target.value), placeholder: "e.g. Electronics" })
          )
        ),
        React.createElement("div", { className: "form-row" },
          React.createElement("label", null, "Price (₹)",
            React.createElement("input", { type: "number", min: "0", step: "0.01", value: form.price, onChange: e => set("price", e.target.value), required: true })
          ),
          React.createElement("label", null, "Stock",
            React.createElement("input", { type: "number", min: "0", value: form.stock, onChange: e => set("stock", e.target.value), required: true })
          )
        ),
        React.createElement("label", null, "Description",
          React.createElement("textarea", { value: form.description, onChange: e => set("description", e.target.value), placeholder: "Optional" })
        ),
        err && React.createElement("p", { className: "error" }, err),
        React.createElement("div", { className: "modal-actions" },
          React.createElement("button", { type: "button", onClick: onClose }, "Cancel"),
          React.createElement("button", { type: "submit", className: "primary", disabled: saving }, saving ? "Saving…" : "Save Product")
        )
      )
    )
  );
}

function Products() {
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(null); // null | "add" | product obj

  useEffect(() => { api("/api/products").then(d => setProducts(d.products)); }, []);

  function onSaved(p) {
    setProducts(prev => {
      const idx = prev.findIndex(x => x.id === p.id);
      return idx >= 0 ? prev.map(x => x.id === p.id ? p : x) : [p, ...prev];
    });
    setModal(null);
  }

  async function del(p) {
    if (!confirm("Delete product '" + p.name + "'?")) return;
    await api("/api/products/" + p.id, { method: "DELETE" });
    setProducts(prev => prev.filter(x => x.id !== p.id));
  }

  return React.createElement("div", null,
    React.createElement("div", { className: "page-head" },
      React.createElement("h2", null, "Products"),
      React.createElement("button", { className: "primary", onClick: () => setModal("add") }, "+ Add Product")
    ),
    React.createElement("div", { className: "panel" },
      React.createElement("table", null,
        React.createElement("thead", null,
          React.createElement("tr", null,
            React.createElement("th", null, "Name"),
            React.createElement("th", null, "SKU"),
            React.createElement("th", null, "Category"),
            React.createElement("th", null, "Price"),
            React.createElement("th", null, "Stock"),
            React.createElement("th", null, "Actions")
          )
        ),
        React.createElement("tbody", null,
          products.length === 0
            ? React.createElement("tr", { className: "empty-row" }, React.createElement("td", { colSpan: 6 }, "No products yet. Add your first one."))
            : products.map(p =>
              React.createElement("tr", { key: p.id },
                React.createElement("td", null, React.createElement("strong", null, p.name)),
                React.createElement("td", null, React.createElement("code", null, p.sku)),
                React.createElement("td", null, p.category || React.createElement("span", { className: "muted" }, "—")),
                React.createElement("td", null, fmt(p.price)),
                React.createElement("td", null,
                  React.createElement("span", { className: "badge " + (p.stock <= 5 ? "low" : "ok") }, p.stock)
                ),
                React.createElement("td", null,
                  React.createElement("div", { className: "row-actions" },
                    React.createElement("button", { onClick: () => setModal(p) }, "Edit"),
                    React.createElement("button", { className: "danger", onClick: () => del(p) }, "Delete")
                  )
                )
              )
            )
        )
      )
    ),
    (modal === "add" || (modal && typeof modal === "object"))
      && React.createElement(ProductModal, { product: modal === "add" ? null : modal, onClose: () => setModal(null), onSaved })
  );
}

// ── Customers ─────────────────────────────────────────────────────────────────

function CustomerModal({ customer, onClose, onSaved }) {
  const blank = { name: "", email: "", phone: "", address: "" };
  const [form, setForm] = useState(customer ? { ...customer } : blank);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setErr(""); }

  async function save(e) {
    e.preventDefault();
    setSaving(true); setErr("");
    try {
      const data = customer
        ? await api("/api/customers/" + customer.id, { method: "PUT", body: JSON.stringify(form) })
        : await api("/api/customers", { method: "POST", body: JSON.stringify(form) });
      onSaved(data.customer);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return React.createElement("div", { className: "modal-overlay", onClick: e => e.target === e.currentTarget && onClose() },
    React.createElement("div", { className: "modal" },
      React.createElement("h3", null, customer ? "Edit Customer" : "Add Customer"),
      React.createElement("form", { className: "stack-form", onSubmit: save },
        React.createElement("label", null, "Full Name",
          React.createElement("input", { value: form.name, onChange: e => set("name", e.target.value), placeholder: "Customer name", required: true })
        ),
        React.createElement("label", null, "Email",
          React.createElement("input", { type: "email", value: form.email, onChange: e => set("email", e.target.value), placeholder: "customer@email.com", required: true })
        ),
        React.createElement("div", { className: "form-row" },
          React.createElement("label", null, "Phone",
            React.createElement("input", { value: form.phone, onChange: e => set("phone", e.target.value), placeholder: "+91 98765 43210" })
          ),
          React.createElement("label", null, "Address",
            React.createElement("input", { value: form.address, onChange: e => set("address", e.target.value), placeholder: "City, State" })
          )
        ),
        err && React.createElement("p", { className: "error" }, err),
        React.createElement("div", { className: "modal-actions" },
          React.createElement("button", { type: "button", onClick: onClose }, "Cancel"),
          React.createElement("button", { type: "submit", className: "primary", disabled: saving }, saving ? "Saving…" : "Save Customer")
        )
      )
    )
  );
}

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [modal, setModal] = useState(null);

  useEffect(() => { api("/api/customers").then(d => setCustomers(d.customers)); }, []);

  function onSaved(c) {
    setCustomers(prev => {
      const idx = prev.findIndex(x => x.id === c.id);
      return idx >= 0 ? prev.map(x => x.id === c.id ? c : x) : [c, ...prev];
    });
    setModal(null);
  }

  async function del(c) {
    if (!confirm("Delete customer '" + c.name + "'?")) return;
    await api("/api/customers/" + c.id, { method: "DELETE" });
    setCustomers(prev => prev.filter(x => x.id !== c.id));
  }

  return React.createElement("div", null,
    React.createElement("div", { className: "page-head" },
      React.createElement("h2", null, "Customers"),
      React.createElement("button", { className: "primary", onClick: () => setModal("add") }, "+ Add Customer")
    ),
    React.createElement("div", { className: "panel" },
      React.createElement("table", null,
        React.createElement("thead", null,
          React.createElement("tr", null,
            React.createElement("th", null, "Name"),
            React.createElement("th", null, "Email"),
            React.createElement("th", null, "Phone"),
            React.createElement("th", null, "Address"),
            React.createElement("th", null, "Actions")
          )
        ),
        React.createElement("tbody", null,
          customers.length === 0
            ? React.createElement("tr", { className: "empty-row" }, React.createElement("td", { colSpan: 5 }, "No customers yet."))
            : customers.map(c =>
              React.createElement("tr", { key: c.id },
                React.createElement("td", null, React.createElement("strong", null, c.name)),
                React.createElement("td", null, c.email),
                React.createElement("td", null, c.phone || React.createElement("span", { className: "muted" }, "—")),
                React.createElement("td", null, c.address || React.createElement("span", { className: "muted" }, "—")),
                React.createElement("td", null,
                  React.createElement("div", { className: "row-actions" },
                    React.createElement("button", { onClick: () => setModal(c) }, "Edit"),
                    React.createElement("button", { className: "danger", onClick: () => del(c) }, "Delete")
                  )
                )
              )
            )
        )
      )
    ),
    (modal === "add" || (modal && typeof modal === "object"))
      && React.createElement(CustomerModal, { customer: modal === "add" ? null : modal, onClose: () => setModal(null), onSaved })
  );
}

// ── Orders ────────────────────────────────────────────────────────────────────

function OrderModal({ customers, products, onClose, onSaved }) {
  const [customerId, setCustomerId] = useState(customers[0]?.id || "");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([]);
  const [newProduct, setNewProduct] = useState(products[0]?.id || "");
  const [newQty, setNewQty] = useState(1);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  function addItem() {
    if (!newProduct) return;
    const prod = products.find(p => p.id === newProduct);
    const existing = items.find(i => i.product_id === newProduct);
    if (existing) {
      setItems(items.map(i => i.product_id === newProduct ? { ...i, quantity: i.quantity + newQty } : i));
    } else {
      setItems([...items, { product_id: newProduct, product_name: prod.name, unit_price: prod.price, quantity: newQty }]);
    }
    setNewQty(1);
  }

  function removeItem(pid) { setItems(items.filter(i => i.product_id !== pid)); }

  const total = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);

  async function save(e) {
    e.preventDefault();
    if (!items.length) { setErr("Add at least one item"); return; }
    setSaving(true); setErr("");
    try {
      const data = await api("/api/orders", {
        method: "POST",
        body: JSON.stringify({ customer_id: customerId, notes, items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })) })
      });
      onSaved(data.order);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return React.createElement("div", { className: "modal-overlay", onClick: e => e.target === e.currentTarget && onClose() },
    React.createElement("div", { className: "modal" },
      React.createElement("h3", null, "New Order"),
      React.createElement("form", { className: "stack-form", onSubmit: save },
        React.createElement("label", null, "Customer",
          React.createElement("select", { value: customerId, onChange: e => setCustomerId(e.target.value) },
            customers.map(c => React.createElement("option", { key: c.id, value: c.id }, c.name + " (" + c.email + ")"))
          )
        ),
        React.createElement("label", null, "Notes",
          React.createElement("textarea", { value: notes, onChange: e => setNotes(e.target.value), placeholder: "Delivery instructions, etc." })
        ),
        React.createElement("div", null,
          React.createElement("p", { className: "muted", style: { margin: "0 0 8px", fontSize: 13 } }, "Order Items"),
          items.map(i =>
            React.createElement("div", { className: "item-row", key: i.product_id },
              React.createElement("span", null, i.product_name),
              React.createElement("span", { className: "muted" }, "×" + i.quantity + " · " + fmt(i.unit_price * i.quantity)),
              React.createElement("button", { type: "button", className: "danger", onClick: () => removeItem(i.product_id) }, "✕")
            )
          ),
          React.createElement("div", { className: "add-item-row" },
            React.createElement("select", { value: newProduct, onChange: e => setNewProduct(e.target.value) },
              products.map(p => React.createElement("option", { key: p.id, value: p.id }, p.name + " (stock: " + p.stock + ")"))
            ),
            React.createElement("input", { type: "number", min: 1, value: newQty, onChange: e => setNewQty(parseInt(e.target.value) || 1), style: { width: 64 } }),
            React.createElement("button", { type: "button", onClick: addItem }, "Add")
          )
        ),
        items.length > 0 && React.createElement("p", { style: { margin: 0, fontWeight: 600 } }, "Total: " + fmt(total)),
        err && React.createElement("p", { className: "error" }, err),
        React.createElement("div", { className: "modal-actions" },
          React.createElement("button", { type: "button", onClick: onClose }, "Cancel"),
          React.createElement("button", { type: "submit", className: "primary", disabled: saving }, saving ? "Placing…" : "Place Order")
        )
      )
    )
  );
}

function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(false);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    Promise.all([
      api("/api/orders").then(d => setOrders(d.orders)),
      api("/api/customers").then(d => setCustomers(d.customers)),
      api("/api/products").then(d => setProducts(d.products))
    ]);
  }, []);

  function onSaved(o) {
    setOrders(prev => [o, ...prev]);
    setModal(false);
    // refresh products for updated stock
    api("/api/products").then(d => setProducts(d.products));
  }

  async function updateStatus(o, status) {
    const data = await api("/api/orders/" + o.id + "/status", { method: "PATCH", body: JSON.stringify({ status }) });
    setOrders(prev => prev.map(x => x.id === o.id ? data.order : x));
  }

  async function del(o) {
    if (!confirm("Delete order #" + o.id + "? Stock will be restored.")) return;
    await api("/api/orders/" + o.id, { method: "DELETE" });
    setOrders(prev => prev.filter(x => x.id !== o.id));
    api("/api/products").then(d => setProducts(d.products));
  }

  const NEXT_STATUS = { pending: "confirmed", confirmed: "shipped", shipped: "delivered" };

  return React.createElement("div", null,
    React.createElement("div", { className: "page-head" },
      React.createElement("h2", null, "Orders"),
      React.createElement("button", { className: "primary", onClick: () => setModal(true) }, "+ New Order")
    ),
    React.createElement("div", { className: "panel" },
      React.createElement("table", null,
        React.createElement("thead", null,
          React.createElement("tr", null,
            React.createElement("th", null, "Order ID"),
            React.createElement("th", null, "Customer"),
            React.createElement("th", null, "Items"),
            React.createElement("th", null, "Total"),
            React.createElement("th", null, "Status"),
            React.createElement("th", null, "Actions")
          )
        ),
        React.createElement("tbody", null,
          orders.length === 0
            ? React.createElement("tr", { className: "empty-row" }, React.createElement("td", { colSpan: 6 }, "No orders yet."))
            : orders.map(o =>
              React.createElement("tr", { key: o.id },
                React.createElement("td", null,
                  React.createElement("a", { href: "#", onClick: e => { e.preventDefault(); setDetail(o); }, style: { color: "var(--primary)" } }, "#" + o.id)
                ),
                React.createElement("td", null, o.customer_name),
                React.createElement("td", null, o.items.length + " item" + (o.items.length !== 1 ? "s" : "")),
                React.createElement("td", null, fmt(o.total)),
                React.createElement("td", null, React.createElement("span", { className: "badge " + o.status }, o.status)),
                React.createElement("td", null,
                  React.createElement("div", { className: "row-actions" },
                    NEXT_STATUS[o.status] && React.createElement("button", { className: "success-btn", onClick: () => updateStatus(o, NEXT_STATUS[o.status]) },
                      "→ " + NEXT_STATUS[o.status]
                    ),
                    o.status !== "cancelled" && o.status !== "delivered" &&
                      React.createElement("button", { className: "danger", onClick: () => updateStatus(o, "cancelled") }, "Cancel"),
                    React.createElement("button", { className: "danger", onClick: () => del(o) }, "Delete")
                  )
                )
              )
            )
        )
      )
    ),
    modal && (customers.length === 0 || products.length === 0)
      && React.createElement("div", { className: "modal-overlay", onClick: e => e.target === e.currentTarget && setModal(false) },
        React.createElement("div", { className: "modal" },
          React.createElement("h3", null, "Cannot Create Order"),
          React.createElement("p", { className: "muted", style: { margin: "0 0 16px", lineHeight: 1.7 } },
            customers.length === 0 && products.length === 0
              ? "You need to add at least one Customer and one Product before creating an order."
              : customers.length === 0
                ? "You need to add at least one Customer before creating an order. Go to the Customers tab first."
                : "You need to add at least one Product before creating an order. Go to the Products tab first."
          ),
          React.createElement("div", { className: "modal-actions" },
            React.createElement("button", { className: "primary", onClick: () => setModal(false) }, "OK, got it")
          )
        )
      ),
    modal && customers.length > 0 && products.length > 0
      && React.createElement(OrderModal, { customers, products, onClose: () => setModal(false), onSaved }),
    detail && React.createElement("div", { className: "modal-overlay", onClick: e => e.target === e.currentTarget && setDetail(null) },
      React.createElement("div", { className: "modal" },
        React.createElement("h3", null, "Order #" + detail.id),
        React.createElement("p", { className: "muted", style: { margin: "0 0 16px" } }, "Customer: " + detail.customer_name),
        React.createElement("table", null,
          React.createElement("thead", null,
            React.createElement("tr", null,
              React.createElement("th", null, "Product"),
              React.createElement("th", null, "Qty"),
              React.createElement("th", null, "Unit Price"),
              React.createElement("th", null, "Subtotal")
            )
          ),
          React.createElement("tbody", null,
            detail.items.map(i =>
              React.createElement("tr", { key: i.id },
                React.createElement("td", null, i.product_name),
                React.createElement("td", null, i.quantity),
                React.createElement("td", null, fmt(i.unit_price)),
                React.createElement("td", null, fmt(i.unit_price * i.quantity))
              )
            )
          )
        ),
        React.createElement("p", { style: { margin: "14px 0 0", fontWeight: 600 } }, "Total: " + fmt(detail.total)),
        detail.notes && React.createElement("p", { className: "muted", style: { marginTop: 8 } }, "Notes: " + detail.notes),
        React.createElement("div", { className: "modal-actions" },
          React.createElement("button", { onClick: () => setDetail(null) }, "Close")
        )
      )
    )
  );
}

// ── App root ──────────────────────────────────────────────────────────────────

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setChecking(false); return; }
    api("/api/auth/me").then(u => { setUser(u); setChecking(false); }).catch(() => { localStorage.removeItem("token"); setChecking(false); });
  }, []);

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  if (checking) return React.createElement("div", { className: "loading" }, "Loading…");
  if (!user) return React.createElement(AuthPage, { onLogin: setUser });

  const pages = { dashboard: Dashboard, products: Products, customers: Customers, orders: Orders };
  const PageComp = pages[page];

  return React.createElement("div", { className: "app-shell" },
    React.createElement(Sidebar, { page, setPage, user, onLogout: logout }),
    React.createElement("main", { className: "main" },
      React.createElement(PageComp, null)
    )
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));