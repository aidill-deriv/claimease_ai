# Travel Claims Class ID Normalization

## Category Mapping Table

| class_id                   | normalized_category | display_category        |
| -------------------------- | ------------------- | ----------------------- |
| null                       | uncategorized       | Uncategorized           |
| Staff_companytrip          | staff_events        | Staff Events            |
| Staff_teambuilding         | staff_events        | Staff Events            |
| Marketing_permit_insurance | marketing           | Marketing               |
| Staff_coteambuilding       | staff_events        | Staff Events            |
| Staff_daily_allowance      | allowances          | Allowances              |
| EXP                        | uncategorized       | Uncategorized           |
| Recruitment                | recruitment         | Recruitment             |
| Travel_flight              | travel_transport    | Travel & Transportation |
| Staff_parking              | staff_transport     | Staff Transportation    |
| Marketing                  | marketing           | Marketing               |
| Travel_others              | travel_others       | Travel - Others         |
| Staff_ deptteambuilding    | staff_events        | Staff Events            |
| Travel_daily_allowance     | allowances          | Allowances              |
| Travel                     | travel_general      | Travel - General        |
| Travel_taxi                | travel_transport    | Travel & Transportation |
| Staff_festive              | staff_events        | Staff Events            |
| Marketing_others           | marketing           | Marketing               |
| Staff_annualdinner         | staff_events        | Staff Events            |
| Marketing_allowance        | allowances          | Allowances              |
| Travel_permit              | travel_admin        | Travel Administration   |
| Staff_taxi                 | staff_transport     | Staff Transportation    |
| Staff_milage_toll          | staff_transport     | Staff Transportation    |

## Category Summary

### Staff Events (6 items)
- Staff_companytrip
- Staff_teambuilding
- Staff_coteambuilding
- Staff_ deptteambuilding
- Staff_festive
- Staff_annualdinner

### Travel & Transportation (2 items)
- Travel_flight
- Travel_taxi

### Staff Transportation (3 items)
- Staff_parking
- Staff_taxi
- Staff_milage_toll

### Allowances (3 items)
- Staff_daily_allowance
- Travel_daily_allowance
- Marketing_allowance

### Marketing (3 items)
- Marketing_permit_insurance
- Marketing
- Marketing_others

### Travel Administration (1 item)
- Travel_permit

### Recruitment (1 item)
- Recruitment

### Travel - General (1 item)
- Travel

### Travel - Others (1 item)
- Travel_others

### Uncategorized (2 items)
- null
- EXP

## Notes

**Data Quality Issues:**
- "Staff_ deptteambuilding" contains a space before 'dept' (typo in source data)
- "EXP" is vague and needs clarification
- null values should be investigated at source

**Design Decision:**
Staff Transportation and Travel & Transportation are kept separate:
- **Staff Transportation**: Daily commute expenses (parking, local taxi, mileage)
- **Travel & Transportation**: Business travel expenses (flights, travel taxi)