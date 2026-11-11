# Divyang Disang Healthcare API

REST API for the Andhra Pradesh healthcare directory.

## Deploy to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://dashboard.render.com/blueprint/new?repo=https://github.com/ramarajusampathirao1985-netizen/divyang-healthcare-api)

Or open the [Render Blueprint deployment page](https://dashboard.render.com/blueprint/new?repo=https://github.com/ramarajusampathirao1985-netizen/divyang-healthcare-api), connect your GitHub account if prompted, review the service, and click **Apply**.

## API endpoints

- `GET /` — API information
- `GET /api/health` — health and dataset availability
- `GET /api/facilities` — list facilities (supports `state`, `city`, `category`, `subcategory`, `approvalStatus`, `isActive`, `search`, `page`, `limit`)
- `GET /api/facilities/:id` — facility by ID
- `GET /api/filters` — available states, cities and categories

Dataset: `data/AP.csv`

## Local run

```bash
npm install
npm start
```
