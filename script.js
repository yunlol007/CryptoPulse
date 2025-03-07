document.addEventListener("DOMContentLoaded", () => {
    // Toggle mobile menu
    const burger = document.querySelector(".burger");
    const navLinks = document.querySelector(".nav-links");

    if (burger && navLinks) {
        burger.addEventListener("click", () => {
            navLinks.classList.toggle("active");
            burger.classList.toggle("active");
        });
    }

    // Theme toggle
    const themeToggle = document.querySelector(".theme-toggle");
    const body = document.body;

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            body.classList.toggle("light-mode");
            const isLightMode = body.classList.contains("light-mode");
            localStorage.setItem("theme", isLightMode ? "light" : "dark");
            themeToggle.textContent = isLightMode ? "🌙" : "☀️";
        });

        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "light") {
            body.classList.add("light-mode");
            themeToggle.textContent = "🌙";
        } else {
            themeToggle.textContent = "☀️";
        }
    }

    // Map CoinGecko IDs to TradingView symbols and HTML symbols
    const symbolMap = {
        bitcoin: "BTCUSDT",
        ethereum: "ETHUSDT",
        binancecoin: "BNBUSDT",
        solana: "SOLUSDT",
        ripple: "XRPUSDT",
        cardano: "ADAUSDT",
        dogecoin: "DOGEUSDT",
        polkadot: "DOTUSDT",
        litecoin: "LTCUSDT",
        chainlink: "LINKUSDT",
        uniswap: "UNIUSDT",
        aave: "AAVEUSDT",
        "avalanche-2": "AVAXUSDT",
        "matic-network": "MATICUSDT",
        cosmos: "ATOMUSDT"
    };
    const coinSymbols = {
        btc: "bitcoin",
        eth: "ethereum",
        bnb: "binancecoin",
        sol: "solana",
        xrp: "ripple",
        ada: "cardano",
        doge: "dogecoin",
        dot: "polkadot",
        ltc: "litecoin",
        link: "chainlink",
        uni: "uniswap",
        aave: "aave",
        avax: "avalanche-2",
        matic: "matic-network",
        atom: "cosmos"
    };

    // Fetch market data from CoinGecko
    async function fetchMarketData() {
        try {
            const proxyUrl = "https://api.allorigins.win/raw?url=";
            const apiUrl = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=15&page=1&sparkline=false";
            const response = await fetch(proxyUrl + encodeURIComponent(apiUrl), {
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const data = await response.json();
            const marketData = data.contents ? JSON.parse(data.contents) : data;

            if (!Array.isArray(marketData)) throw new Error('Market data is not an array');

            updateUIWithMarketData(marketData);
            return marketData;
        } catch (error) {
            console.error('Error fetching market data:', error);
            document.querySelectorAll('.crypto-card').forEach(card => {
                card.querySelector('.price').textContent = "Error loading data";
                card.querySelector('.market-cap').textContent = "Cap: Error";
                card.querySelector('.volume').textContent = "Vol: Error";
                card.querySelector('.supply').textContent = "Supply: Error";
            });
            return null;
        }
    }

    function updateUIWithMarketData(data) {
        if (!data || data.length === 0) {
            document.querySelectorAll('.crypto-card').forEach(card => {
                card.querySelector('.price').textContent = "No data available";
                card.querySelector('.market-cap').textContent = "Cap: N/A";
                card.querySelector('.volume').textContent = "Vol: N/A";
                card.querySelector('.supply').textContent = "Supply: N/A";
            });
            return;
        }

        data.forEach(crypto => {
            const symbol = Object.keys(coinSymbols).find(key => coinSymbols[key] === crypto.id);
            if (symbol) {
                const card = document.querySelector(`.crypto-card[data-symbol="${symbol}"]`);
                if (card) {
                    const price = crypto.current_price?.toLocaleString() || 'N/A';
                    const marketCap = crypto.market_cap?.toLocaleString() || 'N/A';
                    const volume = crypto.total_volume?.toLocaleString() || 'N/A';
                    const supply = crypto.circulating_supply?.toLocaleString() || 'N/A';

                    card.querySelector('.price').textContent = `$${price}`;
                    card.querySelector('.market-cap').textContent = `Cap: $${marketCap}`;
                    card.querySelector('.volume').textContent = `Vol: $${volume}`;
                    card.querySelector('.supply').textContent = `Supply: ${supply}`;

                    const priceChange = crypto.price_change_percentage_24h;
                    if (priceChange !== null && priceChange !== undefined) {
                        card.querySelector('.price').className = `price ${priceChange > 0 ? 'price-up' : 'price-down'}`;
                        card.querySelector('.price').textContent += ` (${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%)`;
                    }
                }
            }
        });
    }

    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    const debouncedFetchMarketData = debounce(fetchMarketData, 1000);

    // TradingView Chart Integration
    function loadTradingViewScript(callback) {
        if (window.TradingView) {
            callback();
            return;
        }
        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/tv.js";
        script.async = true;
        script.onerror = () => console.error("Failed to load TradingView script");
        script.onload = callback;
        document.body.appendChild(script);
    }

    function loadTradingViewChart(coinId) {
        loadTradingViewScript(() => {
            const chartContainer = document.getElementById("tradingview-chart");
            if (!chartContainer) {
                console.error("Chart container not found");
                return;
            }
            chartContainer.innerHTML = "";
            try {
                new TradingView.widget({
                    "container_id": "tradingview-chart",
                    "symbol": `BINANCE:${symbolMap[coinSymbols[coinId]] || 'BTCUSDT'}`,
                    "interval": "D",
                    "theme": "dark",
                    "style": "1",
                    "locale": "en",
                    "toolbar_bg": "#0d0d0d",
                    "hide_top_toolbar": false,
                    "save_image": false,
                    "allow_symbol_change": true,
                    "studies": ["BB@tv-basicstudies", "MACD@tv-basicstudies", "RSI@tv-basicstudies"],
                    "width": "100%",
                    "height": "100%",
                    "autosize": true,
                    "fullscreen": false,
                    "timezone": "Etc/UTC",
                    "enable_publishing": false,
                    "hide_side_toolbar": false
                });
                document.getElementById("chart-container")?.scrollIntoView({ behavior: "smooth" });
            } catch (error) {
                console.error("TradingView widget failed to load:", error);
                new TradingView.widget({
                    "container_id": "tradingview-chart",
                    "symbol": "BINANCE:BTCUSDT",
                    "interval": "D",
                    "theme": "dark",
                    "style": "1",
                    "locale": "en",
                    "toolbar_bg": "#0d0d0d",
                    "autosize": true
                });
            }
        });
    }

    // Crypto card click handlers
    document.querySelectorAll(".crypto-card").forEach(card => {
        card.addEventListener("click", function() {
            const symbol = this.getAttribute("data-symbol");
            loadTradingViewChart(symbol);
            card.classList.add("active");
            setTimeout(() => card.classList.remove("active"), 300);
        });
    });

    // Price Alert System
    const alerts = {};
    function setupPriceAlerts() {
        document.querySelectorAll(".alert-toggle").forEach(button => {
            button.addEventListener("click", function() {
                const coin = coinSymbols[button.getAttribute('data-coin').toLowerCase()] || button.getAttribute('data-coin');
                const threshold = prompt(`Set price change alert for ${coin.toUpperCase()} (e.g., 5 for 5% change):`, "5");
                if (threshold && !isNaN(threshold) && threshold > 0) {
                    alerts[coin] = parseFloat(threshold);
                    alert(`Alert set for ${coin.toUpperCase()} at ${threshold}% change!`);
                    this.textContent = "Alert Set";
                    this.disabled = true;
                }
            });
        });
    }

    async function checkPriceAlerts() {
        if (Object.keys(alerts).length === 0) return;

        const data = await fetchMarketData();
        if (!data) return;

        Object.entries(alerts).forEach(([coin, threshold]) => {
            const card = document.querySelector(`.crypto-card[data-symbol="${coinSymbols[coin.toLowerCase()] || coin.toLowerCase()}"]`);
            if (card) {
                const priceElement = card.querySelector(".price");
                const match = priceElement.textContent.match(/\((\+|-)?\d+\.\d+%\)/);
                if (match) {
                    const change = parseFloat(match[0].replace(/[()%]/g, ''));
                    if (Math.abs(change) >= threshold) {
                        card.classList.add("alert");
                        alert(`Price alert! ${coin.toUpperCase()} changed by ${change}%`);
                        setTimeout(() => card.classList.remove("alert"), 5000);
                    }
                }
            }
        });
    }

    // Fetch and display latest crypto news (without Adsterra popunder)
    async function fetchCryptoNews() {
        const newsContainer = document.getElementById("news-section");
        if (!newsContainer) return;

        newsContainer.innerHTML = '<div class="loading-spinner"></div>';

        try {
            const response = await fetch("https://min-api.cryptocompare.com/data/v2/news/?lang=EN");
            if (!response.ok) throw new Error(`Network error: ${response.status}`);

            const data = await response.json();
            newsContainer.innerHTML = '';

            if (!data.Data || data.Data.length === 0) {
                newsContainer.innerHTML = '<p class="error">No news available at this time.</p>';
                return;
            }

            data.Data.slice(0, 6).forEach(article => {
                const link = article.url.startsWith("http") ? article.url : "https://www.cryptocompare.com";
                const newsCard = document.createElement('div');
                newsCard.classList.add('news-card');
                newsCard.innerHTML = `
                    <img src="${article.imageurl}" alt="${article.title}" class="news-image" loading="lazy">
                    <h3>${article.title}</h3>
                    <p class="news-summary">${article.body.substring(0, 150)}...</p>
                    <p class="news-meta">Source: ${article.source_info.name} | ${new Date(article.published_on * 1000).toLocaleDateString()}</p>
                    <a href="${link}" target="_blank" class="read-more">Read More</a>
                `;

                // Removed Adsterra popunder trigger from news cards
                newsCard.addEventListener("click", () => {
                    window.open(link, "_blank");
                });

                newsContainer.appendChild(newsCard);
            });

        } catch (error) {
            console.error("Error fetching news:", error);
            newsContainer.innerHTML = '<p class="error">Failed to load news.</p>';
        }
    }

    // Portfolio Management
    const portfolios = [];
    const portfolioGrid = document.querySelector(".portfolio-grid");

    function setupPortfolio() {
        const addPortfolioBtn = document.getElementById("add-portfolio");
        if (addPortfolioBtn) {
            addPortfolioBtn.addEventListener("click", () => {
                const coin = prompt("Enter cryptocurrency (e.g., BTC, ETH):")?.toLowerCase();
                const amount = prompt("Enter amount held:");
                if (coin && amount && !isNaN(amount) && amount > 0) {
                    const portfolio = { coin, amount: parseFloat(amount) };
                    portfolios.push(portfolio);
                    updatePortfolioUI();
                    alert(`Added ${amount} ${coin.toUpperCase()} to your portfolio!`);
                }
            });
        }
    }

    function updatePortfolioUI() {
        if (!portfolioGrid) return;

        portfolioGrid.innerHTML = portfolios.map((p, index) => `
            <div class="portfolio-card" id="portfolio-card-${index + 1}">
                <h3>${p.coin.toUpperCase()} Portfolio</h3>
                <p>Amount: ${p.amount}</p>
                <p>Total Value: Loading...</p>
                <p>Profit/Loss: Loading...</p>
            </div>
        `).join('') + '<button class="add-portfolio-btn" id="add-portfolio">Add Portfolio</button>';

        setupPortfolio();

        portfolios.forEach((p, index) => {
            fetchMarketData().then(data => {
                if (!data) return;
                const crypto = data.find(c => c.id === p.coin);
                if (crypto) {
                    const card = document.getElementById(`portfolio-card-${index + 1}`);
                    if (card) {
                        const value = crypto.current_price * p.amount;
                        card.querySelector('p:nth-child(3)').textContent = `Total Value: $${value.toLocaleString()}`;
                        const profitLoss = value * (crypto.price_change_percentage_24h / 100);
                        card.querySelector('p:nth-child(4)').textContent = `Profit/Loss: $${profitLoss.toLocaleString()} (${profitLoss > 0 ? '+' : ''}${crypto.price_change_percentage_24h.toFixed(2)}%)`;
                    }
                }
            });
        });
    }

    // Fetch market trends
    async function fetchMarketTrends() {
        const trendsContainer = document.querySelector(".trends-grid");
        if (!trendsContainer) return;

        trendsContainer.innerHTML = '<div class="loading-spinner"></div>';

        try {
            const response = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=5&page=1");
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const data = await response.json();
            trendsContainer.innerHTML = '';

            data.forEach(crypto => {
                const trendCard = document.createElement('div');
                trendCard.classList.add('trend-card');
                trendCard.innerHTML = `
                    <h1>${crypto.name} (${crypto.symbol.toUpperCase()})</h1>
                    <p>${crypto.price_change_percentage_24h > 0 ? "📈 Up" : "📉 Down"} ${crypto.price_change_percentage_24h.toFixed(2)}% in the last 24 hours.</p>
                `;
                trendsContainer.appendChild(trendCard);
            });

        } catch (error) {
            console.error('Error fetching market trends:', error);
            trendsContainer.innerHTML = '<p class="error">Failed to load market trends.</p>';
        }
    }

    // Metrics
    function updateMetrics() {
        fetchMarketData().then(data => {
            const metricsGrid = document.querySelector(".metrics-grid");
            if (!data || !metricsGrid) return;

            const metrics = [
                { coin: "bitcoin", supply: data.find(c => c.id === "bitcoin")?.circulating_supply.toLocaleString() || "21M", staking: "None", deflationary: "No" },
                { coin: "ethereum", supply: data.find(c => c.id === "ethereum")?.circulating_supply.toLocaleString() || "Unlimited", staking: "5% APY", deflationary: "Yes (EIP-1559)" },
                { coin: "binancecoin", supply: data.find(c => c.id === "binancecoin")?.circulating_supply.toLocaleString() || "200M", staking: "3% APY", deflationary: "Yes" },
                { coin: "solana", supply: data.find(c => c.id === "solana")?.circulating_supply.toLocaleString() || "Unlimited", staking: "7% APY", deflationary: "No" }
            ];
            metricsGrid.innerHTML = metrics.map(metric => `
                <div class="metric-card">
                    <h3>${metric.coin.toUpperCase()} Metrics</h3>
                    <p>Supply: ${metric.supply} | Staking: ${metric.staking} | Deflationary: ${metric.deflationary}</p>
                </div>
            `).join('');
        });
    }

    // Service Worker
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.protocol === 'http:' && location.hostname === '127.0.0.1')) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => console.log('Service Worker registered with scope:', registration.scope))
                .catch(error => console.error('Service Worker registration failed:', error));
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Contact form submission
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(contactForm);
            console.log('Form submitted with:', Object.fromEntries(formData));
            alert('Thank you for your message! We’ll respond quickly.');
            contactForm.reset();
        });
    }

    // Function to set up Privacy link redirect
    function setupPrivacyRedirect() {
        const privacyLinks = document.querySelectorAll('a[href="privacy.html"], a[href="/privacy.html"]');
        privacyLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default navigation
                window.open('https://www.effectiveratecpm.com/x3ci17hx?key=a7d6c08ba04333fcff34e35d758623c6', '_blank'); // Open custom link
            });
        });
    }

    // Global Adsterra Popunder Trigger (excluding Privacy link)
    document.addEventListener('click', (e) => {
        const privacyLinks = document.querySelectorAll('a[href="privacy.html"], a[href="/privacy.html"]');
        let isPrivacyClick = false;
        privacyLinks.forEach(link => {
            if (e.target === link || link.contains(e.target)) {
                isPrivacyClick = true;
            }
        });
        if (!isPrivacyClick) {
            // Trigger Adsterra popunder for all other clicks
            const adScript = document.createElement('script');
            adScript.type = 'text/javascript';
            adScript.src = '//pl26043627.effectiveratecpm.com/d8/8b/95/d88b95887b6438067e91d16427c04ccd.js';
            document.body.appendChild(adScript);
        }
    });

    // Call setup functions
    setupPrivacyRedirect();

    // Initialization
    const init = () => {
        debouncedFetchMarketData();
        loadTradingViewChart("btc");
        fetchCryptoNews();
        setupPriceAlerts();
        setupPortfolio();
        fetchMarketTrends();
        updateMetrics();

        setInterval(debouncedFetchMarketData, 60000); // Market data every minute
        setInterval(checkPriceAlerts, 60000);         // Alerts every minute
        setInterval(fetchCryptoNews, 86400000);       // News daily
        setInterval(fetchMarketTrends, 86400000);     // Trends every 24 hours
        setInterval(updateMetrics, 600000);           // Metrics every 10 minutes
    };

    init();
});







