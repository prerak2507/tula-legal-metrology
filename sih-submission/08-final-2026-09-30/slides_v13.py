import io, os, sys, qrcode
exec(open(sys.argv[3], encoding='utf-8').read())  # helpers_v4.py: template, colours, box/text/arrow helpers, S

LIVE = "tula-legal-metrology.vercel.app"


def qr_png(url):
    img = qrcode.make(url, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=2)
    b = io.BytesIO(); img.save(b, format='PNG'); return b.getvalue()


def tag(sl, x, y, w, t, fill, color=WHITE, size=8.5):
    return box(sl, x, y, w, 0.24, fill=fill, radius=0.1, margin=0.02, paras=[[(t, {"bold": True, "size": size, "color": color})]])


# ================= SLIDE 1: TITLE =================
s = S[0]
remove(s, "TextBox 9")
box(s, 0.42, 2.0, 6.35, 0.8, fill=NAVY, paras=[[("TULA  ", {"bold": True, "size": 26, "color": WHITE}),
    ("Unified Digital Lifecycle Platform for Legal Metrology", {"bold": True, "size": 13, "color": WHITE})]],
    align=PP_ALIGN.LEFT, margin=0.2, radius=0.08)
items = [("Problem Statement ID", "26036"),
         ("Problem Statement Title", "Development of an Online Verification System for Weighing and Measuring Instruments"),
         ("Theme", "Miscellaneous"), ("PS Category", "Software"), ("Team ID", "182718"), ("Team Name", "FriendlyFire")]
tb = s.shapes.add_textbox(Inches(0.42), Inches(3.0), Inches(6.4), Inches(3.3))
tf = tb.text_frame; tf.word_wrap = True
for i, (k, v) in enumerate(items):
    p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
    p.space_after = Pt(5)
    pPr = p._p.get_or_add_pPr(); pPr.set("marL", str(Inches(0.3))); pPr.set("indent", str(-Inches(0.3)))
    bu = etree.SubElement(pPr, qn("a:buFont")); bu.set("typeface", "Arial")
    bc = etree.SubElement(pPr, qn("a:buChar")); bc.set("char", "•")
    r = p.add_run(); r.text = f"{k} – "; _fmt_run(r, 17, True, INK)
    r = p.add_run(); r.text = v; _fmt_run(r, 17, False, INK)
text(s, 0.42, 5.75, 7.4, 0.36, [[("One instrument → one digital ID → one certificate anyone can check", {"italic": True, "bold": True, "color": BLUE, "size": 15})]])
text(s, 0.42, 6.2, 7.4, 0.32, [[("Live prototype: ", {"bold": True, "color": GREEN, "size": 13}), (LIVE, {"color": GREEN, "size": 13, "link": f"https://{LIVE}"})]])
s.notes_slide.notes_text_frame.text = ("One line: scales and fuel pumps are verified on paper today and a buyer cannot tell a real stamp from a fake. "
    "TULA gives every instrument one digital ID, runs its verification online, and issues a signed QR certificate anyone can check.")

# ================= SLIDE 2: IDEA =================
s = S[1]
set_title(s, "TULA: ONE INSTRUMENT, ONE DIGITAL ID", size=28)
team_oval(s); footer(s); remove(s, "TextBox 8")
L, R = 0.4, 12.93; W = R - L
label(s, L, 1.28, 9, "PROPOSED SOLUTION")
box(s, L, 1.56, W, 0.5, fill=LBLUE, align=PP_ALIGN.LEFT, margin=0.15, radius=0.06, paras=[[
    ("A live web + mobile platform: every instrument gets a permanent Digital ID, ", {"bold": True, "size": 12, "color": NAVY}),
    ("and application, scrutiny, field inspection (works offline), signed QR certificate, reminders and enforcement all attach to it.", {"size": 12, "color": INK})]])

label(s, L, 2.14, 9, "DETAILED EXPLANATION: the life of one instrument (built and running)")
steps = [("Register", "account + Digital ID", BLUE), ("Apply", "docs, fee from State Schedule IX", BLUE),
         ("Scrutiny", "approval mark vs DoCA register", PURPLE), ("Assign", "district + workload", BLUE),
         ("Inspect", "phone app, offline", BLUE), ("Decide", "readings vs MPE", ORANGE),
         ("Certificate", "ECDSA-signed QR", GREEN), ("Verify", "any phone, no login", GREEN)]
bw, gap, by, bh = 1.38, (W - 8 * 1.38) / 7, 2.55, 0.78
for i, (t, sub, c) in enumerate(steps):
    x = L + i * (bw + gap)
    fill = {BLUE: WHITE, PURPLE: LPURPLE, ORANGE: LORANGE, GREEN: LGREEN}[c]
    box(s, x, by, bw, bh, fill=fill, line=c, lw=1.5, radius=0.08,
        paras=[[(t, {"bold": True, "size": 12.5, "color": c if c != BLUE else NAVY})], [(sub, {"size": 9, "color": GREY})]])
    circle(s, x - 0.1, by - 0.13, 0.3, str(i + 1), fill=c if c != BLUE else NAVY, size=9.5)
    if i < 7:
        arrow(s, x + bw + 0.02, by + bh / 2, x + bw + gap - 0.02, by + bh / 2, color=NAVY, w=1.5)
x7 = L + 6 * (bw + gap) + bw / 2; x2 = L + 1 * (bw + gap) + bw / 2; ly = by + bh + 0.2
arrow(s, x7, by + bh, x7, ly, color=GREEN, w=1.75, head=False)
arrow(s, x7, ly, x2, ly, color=GREEN, w=1.75, head=False)
arrow(s, x2, ly, x2, by + bh + 0.02, color=GREEN, w=1.75)
text(s, x2 + 0.5, ly + 0.02, 7.2, 0.26, [[("SMS / email reminders at 30, 15, 7, 1 days  →  re-verification on the same Digital ID", {"bold": True, "size": 10.5, "color": GREEN})]])
xi = L + 4 * (bw + gap)
tag(s, xi + (bw - 1.1) / 2, by + bh - 0.12, 1.1, "no network OK", ORANGE)

label(s, L, 3.98, 9, "HOW IT ADDRESSES THE PROBLEM")
probs = [("Paper records in isolated systems", "One live register per State, same system everywhere"),
         ("Manual scheduling, pendency", "Enforced workflow + pendency dashboard"),
         ("Fake or copied certificates", "Signed QR: edits fail, copies show the real serial"),
         ("Missed re-verification dates", "Automatic SMS / email reminders")]
cw = (W - 3 * 0.2) / 4
for i, (p, a) in enumerate(probs):
    x = L + i * (cw + 0.2)
    box(s, x, 4.27, cw, 0.86, fill=LIGHT, align=PP_ALIGN.LEFT, margin=0.14, radius=0.06,
        paras=[[(p, {"size": 10.5, "color": GREY})], [("→ " + a, {"bold": True, "size": 11.5, "color": NAVY})]])

label(s, L, 5.25, 9, "INNOVATION AND UNIQUENESS")
inn = [("Tamper-proof QR", "Server-signed (ECDSA P-256). Signature checks offline on any phone; revocation checks when online. A copied QR shows the original serial", GREEN),
       ("Offline field app", "Installable app. Inspection saves on the phone and syncs, signs and notifies on reconnect", ORANGE),
       ("Computed verdict", "Readings are checked against the error limits in the LM (General) Rules 2011. PASS only when every reading is within the limit", NAVY),
       ("Multi-State by design", "Each State's gazetted fees and rules are data (Delhi, Gujarat loaded). Database rules isolate each State", BLUE),
       ("AI copilot, human decides", "Gemini checks application fields for mismatches; no documents or personal data sent. It never approves, prices or passes anything", PURPLE)]
tw = (W - 4 * 0.15) / 5
for i, (t, d, c) in enumerate(inn):
    x = L + i * (tw + 0.15)
    box(s, x, 5.54, tw, 1.27, fill=c, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, margin=0.11, radius=0.07,
        paras=[[(t, {"bold": True, "size": 12, "color": WHITE})], [(d, {"size": 9.5, "color": WHITE})]])
s.notes_slide.notes_text_frame.text = ("Walk one Delhi shop scale through the 8 steps. Point out: step 5 works with no network, "
    "step 6 is calculated not typed, step 7 is signed on the server, step 8 needs no login or internet. The green loop is re-verification with reminders.")

# ================= SLIDE 3: TECHNICAL =================
s = S[2]
team_oval(s); footer(s); remove(s, "TextBox 8")
LX, LW = 0.4, 8.3
label(s, LX, 1.28, LW, "METHODOLOGY AND PROCESS FOR IMPLEMENTATION (as deployed)")
for t, y, h in [("USERS", 1.58, 0.56), ("APP", 2.36, 0.5), ("SERVER", 3.08, 0.84), ("DATA", 4.14, 0.5)]:
    box(s, LX, y, 1.05, h, fill=NAVY, paras=[[(t, {"bold": True, "size": 10, "color": WHITE})]], radius=0.05)
CX, CW = 1.58, 7.12
users = [("Trader", "apply, pay, track"), ("LMO / GATC", "phone, offline"), ("Controller", "scrutiny, assign"), ("Admins", "State + central"), ("Citizen", "scan QR, no login")]
uw = (CW - 4 * 0.1) / 5
for i, (t, d) in enumerate(users):
    fill, ln = (LGREEN, GREEN) if i == 4 else (WHITE, BLUE)
    box(s, CX + i * (uw + 0.1), 1.58, uw, 0.56, fill=fill, line=ln, radius=0.06,
        paras=[[(t, {"bold": True, "size": 10, "color": NAVY})], [(d, {"size": 8, "color": GREY})]])
box(s, CX, 2.36, CW, 0.5, fill=LBLUE, line=BLUE, radius=0.05, paras=[[
    ("React PWA on Vercel", {"bold": True, "size": 10, "color": NAVY}), ("  ·  installable, opens offline  ·  local copy + sync queue  ·  realtime updates", {"size": 9.5, "color": INK})]])
box(s, CX, 3.08, 3.46, 0.84, fill=LPURPLE, line=PURPLE, radius=0.06, paras=[
    [("Vercel functions (keys stay here)", {"bold": True, "size": 10, "color": PURPLE})],
    [("/api/sign  ECDSA private key, checks officer", {"size": 8.5, "color": INK})],
    [("/api/gemini  ·  /api/notify  (email, SMS)", {"size": 8.5, "color": INK})]])
box(s, CX + 3.66, 3.08, CW - 3.66, 0.84, fill=LGREEN, line=GREEN, radius=0.06, paras=[
    [("Supabase", {"bold": True, "size": 10, "color": GREEN})],
    [("Auth · row-level security · realtime", {"size": 8.5, "color": INK})],
    [("guard triggers · public check RPC", {"size": 8.5, "color": INK})]])
dw = (CW - 2 * 0.1) / 3
for i, (t, d) in enumerate([("Postgres", "instruments, applications, certificates"), ("Append-only audit log", "who, what, when"), ("Rules per State", "fees, validity, officers")]):
    box(s, CX + i * (dw + 0.1), 4.14, dw, 0.5, fill=LIGHT, line=NAVY, radius=0.05,
        paras=[[(t, {"bold": True, "size": 9.5, "color": NAVY})], [(d, {"size": 8, "color": GREY})]])
for xx in (CX + uw / 2, CX + 1.5 * uw + 0.1, CX + 2.5 * uw + 0.2, CX + 3.5 * uw + 0.3):
    arrow(s, xx, 2.15, xx, 2.35, color=BLUE)
arrow(s, CX + 1.7, 2.87, CX + 1.7, 3.07, color=PURPLE)
arrow(s, CX + 5.4, 2.87, CX + 5.4, 3.07, color=GREEN)
arrow(s, CX + 5.4, 3.93, CX + 5.4, 4.13, color=NAVY)
arrow(s, CX + 3.47, 3.5, CX + 3.65, 3.5, color=PURPLE)

# two mini flowcharts
def flow(y, title, steps_, color):
    label(s, LX, y, LW, title, color=color, size=11.5)
    n = len(steps_)
    fw = (LW - (n - 1) * 0.14) / n
    for i, (t, d) in enumerate(steps_):
        x = LX + i * (fw + 0.14)
        box(s, x, y + 0.28, fw, 0.62, fill=WHITE, line=color, lw=1.2, radius=0.06,
            paras=[[(t, {"bold": True, "size": 9.5, "color": color})], [(d, {"size": 7.5, "color": GREY})]])
        if i < n - 1:
            arrow(s, x + fw + 0.01, y + 0.59, x + fw + 0.13, y + 0.59, color=color)

flow(4.78, "HOW A FAKE QR IS CAUGHT", [("Officer passes", "readings all within MPE"), ("Server checks", "officer sign-in + record"),
     ("Signs", "private key, never in app"), ("QR carries", "details + signature"), ("Any phone checks", "public key, offline"),
     ("Result", "genuine / edited / revoked")], GREEN)
flow(5.8, "OFFLINE FIELD INSPECTION", [("No network", "app opens from cache"), ("Inspect", "draft autosaves"), ("Save", "queued on phone"),
     ("Back online", "queue syncs"), ("Certificate", "issued + signed"), ("Owner told", "SMS / email")], ORANGE)

RX, RW = 8.95, 3.98
label(s, RX, 1.28, RW, "TECHNOLOGIES TO BE USED")
tech = [("React 19 · TypeScript · Vite · Tailwind", "installable, mobile-first"),
        ("Service worker · local store · sync queue", "offline work, auto sync"),
        ("Supabase Postgres · RLS · Auth · Realtime", "live, per State"),
        ("Vercel functions · ECDSA P-256 · jsQR", "server signs, phone checks"),
        ("Google Gemini (Flash)", "application checks, help chat"),
        ("Resend · Twilio · jsPDF", "email, SMS, certificate PDF")]
for i, (t, d) in enumerate(tech):
    y = 1.58 + i * 0.38
    c = PURPLE if "Gemini" in t else NAVY
    box(s, RX, y, RW, 0.34, fill=LPURPLE if "Gemini" in t else LIGHT, align=PP_ALIGN.LEFT, margin=0.1, radius=0.05,
        paras=[[(t, {"bold": True, "size": 9, "color": c}), ("  " + d, {"size": 7.5, "color": GREY})]])
label(s, RX, 3.95, RW, "ON A PHONE, FROM THE LIVE PROTOTYPE")
pw = (RW - 0.12) / 2
ph = pw * 591 / 488
SHOTS = os.path.dirname(os.path.abspath(sys.argv[3]))
for i, (img, top, cap) in enumerate([("shot12_verify.jpg", 140, "Buyer scans a fake: rejected"),
                                      ("shot7_officer.jpg", 215, "Reading over the limit: FAIL")]):
    x = RX + i * (pw + 0.12)
    pic = s.shapes.add_picture(os.path.join(SHOTS, img), Inches(x), Inches(4.27), Inches(pw), Inches(ph))
    pic.crop_top = top / 1055
    pic.crop_bottom = (1055 - top - 591) / 1055
    pic.line.color.rgb = RGBColor(0xCB, 0xD5, 0xE1); pic.line.width = Pt(0.75)
    text(s, x, 4.27 + ph + 0.03, pw, 0.3, [[(cap, {"bold": True, "size": 8, "color": INK})]], align=PP_ALIGN.CENTER)
s.notes_slide.notes_text_frame.text = ("Everything in the diagram is deployed and running. Secrets (signing key, Gemini key, SMS keys) live only in the server functions. "
    "The database enforces who sees what, and blocks illegal changes: an owner cannot mark their own scale verified. "
    "Fake QR: the certificate details travel inside the QR with a signature; change one character and the phone rejects it. "
    "The database itself refuses a certificate unless the inspecting officer recorded a pass with every reading inside the limit. "
    "The two screenshots are the live site on a phone.")

# ================= SLIDE 4: FEASIBILITY =================
s = S[3]
team_oval(s); footer(s); remove(s, "TextBox 8")
label(s, 0.4, 1.28, 7.6, "ANALYSIS OF THE FEASIBILITY OF THE IDEA: what is built vs planned")
rows = [("PS requirement", "Live today", "Next"),
        ("Registration, profiles, secure login", "✔ real accounts, 6 roles", "e-Pramaan, phone OTP"),
        ("Apply for (re-)verification", "✔ docs, fee, DoCA approval check", "treasury payment"),
        ("Scheduling, allocation LMO / GATC", "✔ district + workload", "officer calendars"),
        ("Inspection results recorded", "✔ MPE computed, photos, GPS", "cloud photo storage"),
        ("QR certificate + authentication", "✔ signed QR, revocation", "HSM-held key"),
        ("Validity tracking, alerts", "✔ 30/15/7/1-day reminders", "nightly server job"),
        ("SMS / email updates", "◐ email + SMS wired, keys pending", "NIC SMS gateway"),
        ("Dashboards: pending, inspections", "✔ stage, ageing, district", "state-wide wallboard"),
        ("Search, export, print", "✔ search, PDF, CSV", "bulk audit export"),
        ("Mobile app for field officers", "✔ installable, offline", "Android package")]
tx, ty, rh = 0.4, 1.58, 0.275
cols = [(2.85, NAVY), (2.55, GREEN), (2.2, BLUE)]
for ri, row in enumerate(rows):
    y = ty + ri * rh; x = tx
    for ci, (cw_, c) in enumerate(cols):
        hdr = ri == 0
        fill = NAVY if hdr else (LIGHT if ri % 2 else WHITE)
        col = WHITE if hdr else (INK if ci == 0 else (GREEN if row[ci].startswith("✔") else (ORANGE if row[ci].startswith("◐") else GREY)))
        box(s, x, y, cw_, rh, fill=fill, shape=MSO_SHAPE.RECTANGLE, align=PP_ALIGN.LEFT, margin=0.07,
            paras=[[(row[ci], {"bold": hdr or ci == 0, "size": 9 if not hdr else 9.5, "color": col})]])
        x += cw_

label(s, 0.4, 4.66, 7.6, "HOW WE TEST WITH REAL OFFICERS, THEN SCALE", color=ORANGE, size=11)
trial = [("1 · Field trial", "5 LMOs + 1 GATC, 10 inspections each; go ahead only if usability (SUS) ≥ 70"),
         ("2 · District pilot", "All instruments of one district, vs the paper register"),
         ("3 · State rollout", "State loads fees and officers; NIC SMS, treasury, e-Pramaan"),
         ("4 · Multi-State", "DoCA offers it to States: shared platform or State cloud")]
tw = (7.6 - 3 * 0.12) / 4
for i, (t, d) in enumerate(trial):
    box(s, 0.4 + i * (tw + 0.12), 4.93, tw, 0.74, fill=LORANGE, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, margin=0.07, radius=0.06,
        paras=[[(t, {"bold": True, "size": 9.5, "color": ORANGE})], [(d, {"size": 8, "color": INK})]])
    if i < 3:
        arrow(s, 0.4 + i * (tw + 0.12) + tw + 0.005, 5.3, 0.4 + (i + 1) * (tw + 0.12) - 0.005, 5.3, color=ORANGE)

label(s, 0.4, 5.75, 7.6, "VIABILITY: HOW IT GROWS, SURVIVES AND IS FUNDED", color=GREEN, size=11)
via = [("Grow in the market", "Buyers are DoCA and the 36 State / UT Legal Metrology departments; traders and citizens use it free. Each State that adopts is the reference for the next."),
       ("Survive", "No licence fee; pay-per-use cloud whose cost fits in the service charge States already add. No lock-in: public code, standard Postgres, moves to State cloud."),
       ("Get funded", "SIH award and incubation first, then Startup India Seed Fund or MeitY Startup Hub grants to reach the pilot; State e-governance budgets pay for rollout as a work order.")]
vw = (7.6 - 2 * 0.12) / 3
for i, (t, d) in enumerate(via):
    box(s, 0.4 + i * (vw + 0.12), 6.02, vw, 0.82, fill=LGREEN, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, margin=0.07, radius=0.06,
        paras=[[(t, {"bold": True, "size": 9.5, "color": GREEN})], [(d, {"size": 7.5, "color": INK})]])

RX, RW = 8.25, 4.68
text(s, RX, 1.2, 1.9, 0.36, [[("POTENTIAL CHALLENGES AND RISKS", {"bold": True, "size": 9, "color": NAVY})]])
text(s, RX + 1.9, 1.2, RW - 1.9, 0.36, [[("STRATEGIES FOR OVERCOMING THESE CHALLENGES", {"bold": True, "size": 9, "color": NAVY})]])
risks = [("No network at site", "Offline app; syncs, signs and notifies later"),
         ("Fake / copied QR", "Signed QR + revocation list; serial shown on scan"),
         ("Rules differ by State", "Fees and validity are data per State"),
         ("Data privacy (DPDP 2023)", "Row-level security, minimal public fields; AI sees no personal data"),
         ("AI mistakes", "Advisory only; officer decides; logged"),
         ("Officer adoption", "Field trial first; plain home screen per role; larger text option, Hindi")]
for i, (r_, m) in enumerate(risks):
    y = 1.58 + i * 0.47
    box(s, RX, y, 1.9, 0.42, fill=LORANGE, shape=MSO_SHAPE.RECTANGLE, align=PP_ALIGN.LEFT, margin=0.07, paras=[[(r_, {"bold": True, "size": 9, "color": ORANGE})]])
    box(s, RX + 1.9, y, RW - 1.9, 0.42, fill=LIGHT, shape=MSO_SHAPE.RECTANGLE, align=PP_ALIGN.LEFT, margin=0.07, paras=[[(m, {"size": 9, "color": INK})]])
box(s, RX, 4.55, RW, 2.25, fill=LBLUE, radius=0.08)
qr_demo = s.shapes.add_picture(io.BytesIO(qr_png(f"https://{LIVE}/demo")), Inches(RX + 0.12), Inches(4.67), Inches(1.45), Inches(1.45))
qr_demo.click_action.hyperlink.address = f"https://{LIVE}/demo"
text(s, RX + 1.7, 4.67, RW - 1.8, 2.05, [
    [("Complete live demo", {"bold": True, "size": 13, "color": NAVY})],
    [("Scan for the guided demo: register → apply → officer inspects (try offline) → signed certificate → scan the QR on another phone. Each step ticks itself.", {"size": 9.5, "color": INK})],
    [("One-tap evaluator sign-in on the site", {"bold": True, "size": 9.5, "color": INK})],
    [(f"{LIVE}/demo", {"bold": True, "size": 10, "color": BLUE, "link": f"https://{LIVE}/demo"})]], spacing=3)
s.notes_slide.notes_text_frame.text = ("Table is honest: tick = works on the live site now, half = wired but needs a provider key. "
    "Before the final build we test with 5 LMOs and 1 GATC in one district and only proceed if the usability score is at least 70. "
    "Viability: the customer is the government; traders and citizens never pay. Running cost is small (pay-per-use cloud, no licence fee) and fits in the "
    "service charge States already collect. Funding path: SIH award and incubation, then Startup India Seed Fund or MeitY Startup Hub, then State e-governance budgets.")

# ================= SLIDE 5: IMPACT =================
s = S[4]
team_oval(s); footer(s); remove(s, "TextBox 8")
L = 0.4; W = 12.53; cw = (W - 3 * 0.2) / 4
label(s, L, 1.28, 9, "POTENTIAL IMPACT ON THE TARGET AUDIENCE")
icons = {"LMOs & GATCs": pic_blob(4, "FaClipboard"), "Businesses": pic_blob(4, "FaStore"), "Consumers": pic_blob(4, "FaUsers"), "Government": pic_blob(4, "FaLandmark")}
aud = [("LMOs & GATCs", ["Assigned inspections, even offline", "Pass / fail computed automatically", "Certificate issued on site"], BLUE),
       ("Businesses", ["Apply and pay without a visit", "SMS / email at every step", "Reminder before a stamp expires"], GREEN),
       ("Consumers", ["Scan any certificate QR", "Fakes and edits are rejected", "Report a problem in two taps"], ORANGE),
       ("Government", ["Pending by stage, age, district", "Inspections due and overdue", "Full audit trail per instrument"], NAVY)]
for i, (t, pts, c) in enumerate(aud):
    x = L + i * (cw + 0.2)
    box(s, x, 1.58, cw, 1.5, fill=LIGHT, radius=0.08)
    text(s, x + 0.15, 1.66, cw - 0.9, 0.35, [[(t, {"bold": True, "size": 13, "color": c})]])
    if icons.get(t):
        box(s, x + cw - 0.62, 1.64, 0.46, 0.46, fill=c, shape=MSO_SHAPE.OVAL)
        s.shapes.add_picture(io.BytesIO(icons[t]), Inches(x + cw - 0.52), Inches(1.74), Inches(0.26), Inches(0.26))
    text(s, x + 0.15, 2.06, cw - 0.25, 1.0, [[("•  " + p_, {"size": 10, "color": INK})] for p_ in pts], spacing=2)

label(s, L, 3.2, 12, "MEASURED ON THE LIVE SYSTEM (30 Sep 2026, scripted end-to-end run on the production database)", color=GREEN)
meas = [("2 min 51 s", "application filed → signed certificate (system time, 3 people, no paper)"),
        ("6 s", "certificate issued → signed copy back on the phone (incl. network)"),
        ("6 / 6", "forged or edited QR copies rejected (automated tests)"),
        ("0", "paper forms and office visits in the run")]
for i, (n, d) in enumerate(meas):
    x = L + i * (cw + 0.2)
    box(s, x, 3.48, cw, 0.98, fill=GREEN, radius=0.08, paras=[[(n, {"bold": True, "size": 22, "color": WHITE})], [(d, {"size": 9, "color": "E6F4EC"})]])

label(s, L, 4.58, 12, "PILOT TARGETS (to be compared with the pilot district's paper register)")
kpi = [("≤ 7 days", "application → certificate (median)"), ("< 3 s", "certificate check by QR scan"),
       ("100%", "due instruments reminded 30 days early"), ("0", "paper certificates in the pilot district")]
for i, (n, d) in enumerate(kpi):
    x = L + i * (cw + 0.2)
    box(s, x, 4.86, cw, 0.8, fill=NAVY, radius=0.08, paras=[[(n, {"bold": True, "size": 18, "color": WHITE})], [(d, {"size": 9, "color": "D6E2F0"})]])

label(s, L, 5.76, 11, "BENEFITS OF THE SOLUTION (SOCIAL, ECONOMIC, ENVIRONMENTAL, ETC.)")
ben = [("Social", "Fair weight at shops, pumps and mandis. Buyers can check.", ORANGE),
       ("Economic", "Fewer visits and faster renewals for traders and MSMEs.", GREEN),
       ("Environmental", "Paperless forms, certificates and records.", BLUE),
       ("Governance", "One auditable trail from application to enforcement.", NAVY)]
for i, (t, d, c) in enumerate(ben):
    x = L + i * (cw + 0.2)
    box(s, x, 6.04, 1.25, 0.78, fill=c, paras=[[(t, {"bold": True, "size": 10, "color": WHITE})]], radius=0.06, margin=0.03)
    box(s, x + 1.25, 6.04, cw - 1.25, 0.78, fill=LIGHT, align=PP_ALIGN.LEFT, margin=0.1, radius=0.06, paras=[[(d, {"size": 9.5, "color": INK})]])
s.notes_slide.notes_text_frame.text = ("Green numbers were measured on the live system on 30 Sep 2026; they measure the software, not the physical test time on site. "
    "Blue numbers are pilot targets we will measure against the district's paper register. Dashboards for pending applications and inspections are live in the Pendency & Impact screen.")

# ================= SLIDE 6: RESEARCH =================
s = S[5]
set_title(s, "RESEARCH AND REFERENCES")
team_oval(s); footer(s); remove(s, "TextBox 8")
label(s, 0.4, 1.28, 8, "DETAILS / LINKS OF THE REFERENCE AND RESEARCH WORK")
text(s, 0.95, 1.58, 3.4, 0.28, [[("RESEARCH FINDING", {"bold": True, "size": 11, "color": GREY})]])
text(s, 4.72, 1.58, 3.2, 0.28, [[("DESIGN DECISION IN TULA", {"bold": True, "size": 11, "color": GREEN})]])
res = [("Sec. 24: every instrument used in trade is verified and stamped. GATC Rules 2013 let approved test centres verify some.", "One workflow for LMO and GATC, routed by district and equipment"),
       ("Delhi and Gujarat publish the same Schedule IX fees; rule 16 adds on-site and late fees; validity is rule 27 (12 or 24 months).", "Gazetted schedules loaded as data; every fee cites its item and links the source"),
       ("Certificate form is Schedule VIII; the stamp carries the officer's number and a quarter mark A to D (rule 15).", "Certificate and PDF follow Schedule VIII, signed and QR-checkable"),
       ("DoCA publishes all 10,050 model approvals since 2011, but no register of individual verified instruments.", "Approval mark checked against the DoCA register; TULA adds the missing per-instrument record"),
       ("Error limits are set by the LM (General) Rules 2011 (Seventh and Eighth Schedules), based on OIML R 76 and R 117.", "Pass / fail computed from recorded readings against those limits, not typed"),
       ("A buyer cannot tell a genuine stamp from a fake; field sites often have no network.", "Signed QR anyone can check, offline; officer app works offline")]
for i, (f, d) in enumerate(res):
    y = 1.9 + i * 0.82
    circle(s, 0.4, y + 0.2, 0.38, str(i + 1), fill=BLUE, size=10.5)
    box(s, 0.95, y, 3.45, 0.72, fill=LIGHT, align=PP_ALIGN.LEFT, margin=0.1, radius=0.06, paras=[[(f, {"size": 8.8, "color": INK})]])
    arrow(s, 4.44, y + 0.36, 4.68, y + 0.36, color=GREEN, w=2)
    box(s, 4.72, y, 3.3, 0.72, fill=LGREEN, line=GREEN, align=PP_ALIGN.LEFT, margin=0.1, radius=0.06, paras=[[(d, {"bold": True, "size": 9.3, "color": GREEN})]])

RX, RW = 8.3, 4.63
box(s, RX, 1.58, RW, 2.05, fill=LIGHT, radius=0.06)
text(s, RX + 0.15, 1.62, RW - 0.3, 0.3, [[("References (official, click to open)", {"bold": True, "size": 12, "color": BLUE})]])
refs = [
    ("Legal Metrology Act, 2009", "https://lmdca.gujarat.gov.in/clmdca/documents/the-legal-metrology-act-2009.pdf"),
    ("Delhi LM (Enforcement) Rules 2011: Sch. VIII, IX, XI", "https://weightnmeasures.delhi.gov.in/sites/default/files/inline-files/delhi_legal_metrology_enforcement_rules_2011_english.pdf"),
    ("Gujarat fee schedule (Schedule IX)", "https://lmdca.gujarat.gov.in/en/fee-structure"),
    ("Delhi W&M FAQ: validity periods", "https://weightnmeasures.delhi.gov.in/sites/default/files/inline-files/w_m_manual_17-faqs.pdf"),
    ("DoCA Model Approval register (10,050 entries)", "https://lm.doca.gov.in/modelapproval/Certificates.aspx"),
    ("LM (General) Rules 2011: instrument specifications (DoCA)", "https://consumeraffairs.gov.in/pages/legal-metrology-overview"),
    ([("OIML R 76-1 (scales)", "https://www.oiml.org/en/files/pdf_r/r076-1-e06.pdf"), ("  ·  ", None), ("R 117-1 (fuel dispensers)", "https://www.oiml.org/en/files/pdf_r/r117-1-e19.pdf")], None),
    ("All sources, with what each is used for", f"https://{LIVE}/sources"),
]
tb = s.shapes.add_textbox(Inches(RX + 0.15), Inches(1.92), Inches(RW - 0.3), Inches(1.68))
tf = tb.text_frame; tf.word_wrap = True
for i, (label_, url) in enumerate(refs):
    p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
    p.space_after = Pt(1.5)
    r = p.add_run(); r.text = f"{i + 1}.  "; _fmt_run(r, 9, True, BLUE)
    for part, link in (label_ if isinstance(label_, list) else [(label_, url)]):
        r = p.add_run(); r.text = part; _fmt_run(r, 9, False, NAVY)
        if link: r.hyperlink.address = link; r.font.underline = True
label(s, RX, 3.72, RW, "COMPARED WITH TODAY", size=11.5)
cmp_rows = [("", "Paper", "Typical State portal", "TULA"),
            ("Certificate", "copyable paper", "editable PDF", "signed QR"),
            ("Buyer can check", "no", "rarely", "any phone, offline"),
            ("Field record", "register", "typed later", "phone, offline"),
            ("Pass / fail", "judgement", "typed", "computed vs MPE"),
            ("Across States", "separate", "one per State", "one platform")]
cws = [1.15, 0.95, 1.2, 1.33]
for ri, row in enumerate(cmp_rows):
    x = RX
    for ci, w_ in enumerate(cws):
        hdr = ri == 0
        fill = NAVY if hdr else (LGREEN if ci == 3 else (LIGHT if ri % 2 else WHITE))
        col = WHITE if hdr else (GREEN if ci == 3 else (INK if ci == 0 else GREY))
        box(s, x, 3.98 + ri * 0.22, w_, 0.22, fill=fill, shape=MSO_SHAPE.RECTANGLE, align=PP_ALIGN.LEFT, margin=0.05,
            paras=[[(row[ci], {"bold": hdr or ci in (0, 3), "size": 8, "color": col})]])
        x += w_
box(s, RX, 5.35, RW, 1.47, fill=LGREEN, radius=0.06)
qr_cert = s.shapes.add_picture(io.BytesIO(qr_png(f"https://{LIVE}/verify/DL%2FLM%2F2026%2F08913")), Inches(RX + 0.1), Inches(5.43), Inches(1.3), Inches(1.3))
qr_cert.click_action.hyperlink.address = f"https://{LIVE}/verify/DL%2FLM%2F2026%2F08913"
text(s, RX + 1.5, 5.45, RW - 1.6, 1.3, [
    [("Scan: a real certificate", {"bold": True, "size": 12, "color": GREEN})],
    [("DL/LM/2026/08913, issued and signed on the live system on 30 Sep 2026. Your phone checks the signature.", {"size": 9.5, "color": INK})],
    [("Code: ", {"size": 8.5, "color": GREY}), ("github.com/prerak2507/tula-legal-metrology", {"size": 8.5, "color": GREY, "link": "https://github.com/prerak2507/tula-legal-metrology"})]], spacing=2)
s.notes_slide.notes_text_frame.text = ("Each decision traces to a published rule; every reference is a clickable official document, checked on 1 Oct 2026.  Invite the judges to scan the green QR: it opens a certificate "
    "we issued and signed on the live system during testing.")

tpl.save(OUT)
print("saved", OUT)
