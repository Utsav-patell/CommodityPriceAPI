const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();

// Commodity Mapping
let commodityMapping = {};

async function initializeCommodityMapping() {
    try {
        const response = await axios.get('https://agmarknet.gov.in/SearchCmmMkt.aspx?Tx_Commodity=137&Tx_State=0&Tx_District=0&Tx_Market=0&DateFrom=30-Aug-2024&DateTo=30-Aug-2024&Fr_Date=30-Aug-2024&To_Date=30-Aug-2024&Tx_Trend=0&Tx_CommodityHead=Ajwan&Tx_StateHead=--Select--&Tx_DistrictHead=--Select--&Tx_MarketHead=--Select--'); // Replace with the URL of the page containing the select element
        const $ = cheerio.load(response.data);
        commodityMapping = {};

        $('#ddlCommodity option').each((index, element) => {
            const value = $(element).attr('value');
            const text = $(element).text();
            if (value && text && value !== '0') { // Skip the placeholder option
                commodityMapping[text.toLowerCase()] = value;
            }
        });
    } catch (error) {
        console.error('Error fetching commodity mapping:', error);
    }
}

// Initialize the mapping once when the server starts
initializeCommodityMapping();

app.get('/api/get-market-data/:commodityName', async (req, res) => {
    try {
        const commodityName = req.params.commodityName.toLowerCase();
        const commodityIndex = commodityMapping[commodityName];

        if (!commodityIndex) {
            return res.status(404).json({ error: 'Commodity not found' });
        }

        const url = `https://agmarknet.gov.in/SearchCmmMkt.aspx?Tx_Commodity=${commodityIndex}&Tx_State=0&Tx_District=0&Tx_Market=0&DateFrom=30-Aug-2024&DateTo=30-Aug-2024&Fr_Date=30-Aug-2024&To_Date=30-Aug-2024&Tx_Trend=0&Tx_CommodityHead=Banana&Tx_StateHead=Gujarat&Tx_DistrictHead=Bharuch&Tx_MarketHead=--Select--`;
        // Fetch the HTML Code of the provided URL
        const { data } = await axios.get(url);
        
        // Load the HTML content into Cheerio
        const $ = cheerio.load(data);
        
        let marketData = [];
        let isEmpty;

        $('#cphBody_GridPriceData tr').each((index, element) => {
            if (index === 0) return; // Skip the header row
            
            let row = {};
            $(element).find('td').each((i, el) => {
                switch (i) {
                    case 0:
                        if ($(el).text().trim() === "No Data Found") {
                            isEmpty = true;
                            return false; // Break out of the loop
                        } else {
                            row["slNo"] = $(el).text().trim();
                            isEmpty = false;
                            break;
                        }
                    case 1:
                        row["districtName"] = $(el).text().trim();
                        break;
                    case 2:
                        row["marketName"] = $(el).text().trim();
                        break;
                    case 3:
                        row["commodity"] = $(el).text().trim();
                        break;
                    case 4:
                        row["variety"] = $(el).text().trim();
                        break;
                    case 5:
                        row["grade"] = $(el).text().trim();
                        break;
                    case 6:
                        row["minPrice"] = $(el).text().trim();
                        break;
                    case 7:
                        row["maxPrice"] = $(el).text().trim();
                        break;
                    case 8:
                        row["modalPrice"] = $(el).text().trim();
                        break;
                    case 9:
                        row["priceDate"] = $(el).text().trim();
                        break;
                }
            });
            marketData.push(row);
        });

        res.json({
            isEmpty,
            data: marketData
        });
    } catch (error) {
        console.error('Error fetching market data:', error);
        res.status(500).send('Error fetching data');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
