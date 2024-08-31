const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const {storeData,fetchData} = require('./database/cloudstore');
const {getCommodityMapping,getStateMapping,getStateDistrictMapping} = require('./scarpers/mapping');
const app = express();

// below line will fetch the body data and give in json format
app.use(express.json())

app.post('/api/send_district_mapping',async(req,res)=>{
    try {
        const districtMapping = await getStateDistrictMapping();
        // console.log(districtMapping);
        await storeData(districtMapping,'district');    
        res.send("Success");
    } catch (error) {
        console.log(error)
        res.status(500).send('Error fetching commodity');
    }
})


app.post('/api/send_state_mapping',async(req,res)=>{
    try {
        const stateMap = await getStateMapping();
        console.log(stateMap);
        await storeData(stateMap,'state');    
        res.send("Success");
    } catch (error) {
        console.log(error)
        res.status(500).send('Error fetching commodity');
    }
})

app.post('/api/send_commodity_mapping',async (req,res)=>{
    try {
    const commodityMap = await getCommodityMapping();
    console.log(commodityMap);
    await storeData(commodityMap,'commodity'); 
    res.send("Success");
    } catch (error) {
        console.log(error)
        res.status(500).send('Error fetching commodity');
    }  
})

app.get('/api/get-market-data/:commodity/:state/:district', async (req, res) => {
    try {
        // Fetch Parameters from URL
        const {commodity,state,district} = req.params;
        

        // Fetch Mapping from Database
        const commodityMap = await fetchData('commodity');
        const stateMap = await fetchData('state');
        const districtMap = await fetchData('district');
        
        
        // Fetching Index
        const commodityIndex = commodityMap[commodity.toLowerCase()];
        const stateIndex = stateMap[state.toLowerCase()];
        const districtIndex = districtMap[state.toLowerCase()][district.toLowerCase()];
        
        
        

        const url = `https://agmarknet.gov.in/SearchCmmMkt.aspx?Tx_Commodity=${commodityIndex}&Tx_State=${stateIndex}&Tx_District=${districtIndex}&Tx_Market=0&DateFrom=28-Aug-2024&DateTo=30-Aug-2024&Fr_Date=30-Aug-2024&To_Date=30-Aug-2024&Tx_Trend=0&Tx_CommodityHead=Banana&Tx_StateHead=Gujarat&Tx_DistrictHead=Bharuch&Tx_MarketHead=--Select--`;
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










        // Sample API for debuging firebase
        // app.post('/create',async(req,res)=>{
        // const data = req.body;
        // // console.log(data);
        // await storeData(data,'commodity');
        // res.send({msg:'Data Stored'});
        // });
        
        // app.get('/read',async(req,res)=>{
        //     // console.log(data);
        //      const data = await fetchData('commodity').then("Data Read").catch((err)=>{console.log(err)});
        //     res.send(data);
        //     });
