# PG Ease — QA tester integration bugs (27 Nov 2026)

Unzip into `docs/redesign/tester-day5/` in the PG Ease repos. Work the bugs with the Antigravity prompt `tester-integration-bugfix.md`.

This pack is the tester's Word document plus the 15 screenshots embedded in it, in **`word/document.xml` `r:embed` order** (image1.png … image15.png). Bugs 1 and 3 have no screenshot in the document.

Prompt: `antigravity-prompts/tester-integration-bugfix.md`  
This work runs **after Round 4**. Do not undo Round 4 or Round 3.

## Files

| Path | What it is |
|---|---|
| `tester-integration-bugs.docx` | Tester's integration-testing write-up and screenshots (original document) |
| `media/image1.png` … `media/image15.png` | The 15 embedded screenshots, original names |

## Screenshot → bug mapping (document.xml order)

The tester's original numbering skipped some IDs (jumped from 9 to 13). Use **Bugs 1–14** from the prompt. Wi-Fi is one bug with two parts (9a edit, 9b multiple networks).

| File | document.xml | Tester # | Prompt bug | What it shows |
|---|---|---|---|---|
| *(none)* | — | 1 | **1** | Mobile OTP: user can request another OTP while the countdown is still running. No screenshot. |
| `media/image1.png` | 1st embed (`rId5`) | 2 | **2** | **Web reference** (`app.pgease.com/onboarding`): teal **OWNER ONBOARDING** pill and **Support: +91 77019 53356**. The owner **mobile** sign-up is missing both. |
| *(none)* | — | 3 | **3** | "Use Current Location" shows "Location permission showing denied, please enter address and 6-digit OTP manually" even when permission is granted. No screenshot. |
| `media/image2.png` | 2nd embed (`rId6`) | 4 | **4** | **Recommended snackbar:** green bar, white check, white text "Floor added successfully.", WCAG-AA contrast. The live Add Block / Add Floor toast is unreadable. |
| `media/image3.png` | 3rd embed (`rId7`) | 5 | **5** | Owner KYC & Digital Agreements. Toast claims **"KYC Request Sent — Aadhaar DigiLocker verification link sent to tenant via WhatsApp."** Rows are **Pending OTP**. The WhatsApp message was not received — false success. |
| `media/image4.png` | 4th embed (`rId8`) | 6 | **6** | Tenant Documents & KYC. "Room Lease Agreement" (valid from 26/11/2026) is status **Draft**. No **Pending Signature** and no **View & Sign Agreement**. Also typo "Aodhaar KYC". |
| `media/image5.png` | 5th embed (`rId9`) | 7 | **7** | Tenant Rent & Payments starting page: **Pay** on Room Rent ₹5,000 (Pending), **Pay** on Security Deposit ₹10,000 (Pending), and **Advance Payment**. Tapping any opens a **blank screen**. Hero also shows Outstanding **₹0 / All Clear** while dues are pending. |
| `media/image6.png` | 6th embed (`rId10`) | 8 | **8** | Owner Food & Meals → Set Meal Timings. Toast **"Failed to update schedule"** with raw validation `schedule.3.lunch.startTime must be HHmm (24h)` (and lunch/dinner end times). Breakfast 08:00–09:30 is not saved. |
| `media/image7.png` | 7th embed (`rId11`) | 9 | **9a** | Owner Configure Floor WiFi modal (A block / 1st floor, SSID `Krishna_Icon_PG_1st_floor`). Editing a saved network does not persist. |
| `media/image8.png` | 8th embed (`rId12`) | (unnumbered, after 9) | **9b** | Owner WiFi list: **Saved networks 1**, 1st floor already has "airtel wifi". The owner cannot add a second Wi-Fi network for the same PG. |
| `media/image9.png` | 9th embed (`rId13`) | 13 | **10** | Tenant Complaints list. A newly raised complaint is not shown until a manual refresh. |
| `media/image10.png` | 10th embed (`rId14`) | 14 | **11** (owner) | Owner Visitor Movement Register: guest **mohini mohini** for Payal barve, **Approve** and **Reject** still visible. |
| `media/image11.png` | 11th embed (`rId15`) | 14 | **11** (tenant) | Tenant Guest Pass for the **same** visit already shows **Approved** (Under Review 0, Approved 1). Statuses do not match. |
| `media/image12.png` | 12th embed (`rId16`) | 15 | **12** | Owner Night Out, Payal barve, **Parent Not Informed**. Toast **"Failed to notify guardian"** and raw `Cannot POST /api/property-owners/properties/{id}/night-out-requests/{id}/inform-parent`. |
| `media/image13.png` | 13th embed (`rId17`) | 16 | **13** | Tenant Night Out after the owner acted: **All (0) / Pending (0) / Approved (0) / Rejected (0)** and empty state "No Night Out Requests". The request vanished instead of moving to a status tab. Fix owner + tenant. |
| `media/image14.png` | 14th embed (`rId18`) | 17 | **14** (tenant) | Tenant Notice Period: **Active Move-Out Notice**, Under Notice, served 26/11/2026, vacate 31/12/2026, 35 days remaining. Tenant-side request succeeded. |
| `media/image15.png` | 15th embed (`rId19`) | 17 | **14** (owner) | Owner Notice Period for the same PG: **Active Notices 0**, "No tenants currently on notice". The request never appears. |

## Tester's 11 integration flows (re-run after the fixes)

1. Tenant Dashboard — address and room sync
2. Aadhaar KYC
3. Rental agreement e-sign
4. Rent & Payments
5. Complaints
6. Wi-Fi
7. Food & Meal Menu
8. Guest Pass
9. Night Out
10. Notice Board
11. Notice Period
