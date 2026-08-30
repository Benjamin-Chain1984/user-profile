# IDDSI Placemat Print & Mobile Overhaul

## Goal
Rebuild the placemat into a clear, clinically focused A4 landscape sheet that prints on one page and remains fully inspectable on a phone.

## Changes
- Replace the current dense layout with a structured three-zone clinical layout:
  1. person identity and large FOOD / DRINK IDDSI level blocks,
  2. mealtime support details (PIRATES, equipment, preferences),
  3. safety and testing (choking/aspiration signs, escalation, two large QR codes).
- Add a prominent, persistent cue: **“Always refer to the person’s current Mealtime Management Plan before providing food or drink.”**
- Add concise, clearly separated signs of choking and signs of aspiration.
- Add a numbered escalation pathway covering immediate response, emergency action, documentation/incident reporting, and clinical review including the speech pathologist.
- Enlarge both QR codes and place them in distinct FOOD TESTING and DRINK TESTING blocks with the selected level and testing-method title beside each code.
- Preserve independent level-specific QR mappings and existing validation.

## Mobile Preview
- Replace the unreliable page-level horizontal overflow with a dedicated touch-scroll preview viewport using momentum scrolling and explicit minimum width.
- Add a clear “Swipe to view full placemat” cue and left/right controls so the full A4 sheet and both QR codes are reachable on a phone.
- Add compact QR verification cards outside the scaled print sheet so each testing QR can be viewed and scanned directly on mobile.

## Print Reliability
- Rebalance type, spacing, and section heights to prevent clipping within the fixed A4 canvas.
- Use print-safe dimensions and overflow rules so all sections fit on one A4 landscape page at actual size.
- Keep editing controls, navigation, mobile controls, and helper content out of print output.

## Validation
- Verify type safety.
- Verify the mobile preview can scroll from the left edge to the right edge and exposes both QR codes.
- Verify the printed A4 layout fits one landscape page without clipped sections.
