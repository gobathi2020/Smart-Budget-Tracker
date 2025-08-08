// Global variables
        let transactions = [];
        let goals = [];
        let budgets = [];
        let charts = {};
        let selectedCategory = 'salary';
        let editingTransactionId = null;
        let currentCurrency = { symbol: '₹', code: 'INR' };
        let lastTransactionId = null;
        let currentSection = 'dashboard';
        let transactionEditTimers = new Map(); // Track edit timers for each transaction
        let dashboardLayout = ['quick-add', 'summary-cards', 'rule-section', 'charts-section']; // Default layout order
        
        // Enhanced category definitions with modern 3D icons
        const categories = {
            income: [
                { id: 'salary', name: 'Salary', icon: '💰' },
                { id: 'freelancing', name: 'Freelancing', icon: '🖥️' },
                { id: 'business', name: 'Business Income', icon: '🏢' },
                { id: 'rental', name: 'Rental Income', icon: '🏘️' },
                { id: 'dividends', name: 'Dividends', icon: '📊' },
                { id: 'interest', name: 'Interest', icon: '🏛️' },
                { id: 'bonus', name: 'Bonus', icon: '🎉' },
                { id: 'other-income', name: 'Other Income', icon: '💎' }
            ],
            expense: [
                { id: 'rent', name: 'Rent/EMI', icon: '🏠' },
                { id: 'groceries', name: 'Groceries', icon: '🛒' },
                { id: 'utilities', name: 'Utilities', icon: '⚡' },
                { id: 'healthcare', name: 'Healthcare', icon: '🏥' },
                { id: 'transport', name: 'Transport', icon: '🚗' },
                { id: 'petrol', name: 'Petrol/Fuel', icon: '⛽' },
                { id: 'entertainment', name: 'Entertainment', icon: '🎭' },
                { id: 'dining', name: 'Dining Out', icon: '🍽️' },
                { id: 'shopping', name: 'Shopping', icon: '🛍️' },
                { id: 'travel', name: 'Travel/Trip', icon: '✈️' },
                { id: 'gadgets', name: 'Gadgets', icon: '📱' },
                { id: 'clothing', name: 'Clothing', icon: '👕' },
                { id: 'education', name: 'Education', icon: '🎓' },
                { id: 'insurance', name: 'Insurance', icon: '🛡️' },
                { id: 'fitness', name: 'Fitness', icon: '💪' },
                { id: 'beauty', name: 'Beauty & Personal Care', icon: '💄' },
                { id: 'gifts', name: 'Gifts & Donations', icon: '🎁' },
                { id: 'subscriptions', name: 'Subscriptions', icon: '📺' },
                { id: 'maintenance', name: 'Maintenance & Repairs', icon: '🔧' },
                { id: 'taxes', name: 'Taxes', icon: '📋' },
                { id: 'other-expense', name: 'Other Expenses', icon: '💸' }
            ],
            savings: [
                { id: 'mutual-funds', name: 'Mutual Funds', icon: '📈' },
                { id: 'stock-market', name: 'Stock Market', icon: '📊' },
                { id: 'fixed-deposit', name: 'Fixed Deposit', icon: '🏦' },
                { id: 'ppf', name: 'PPF', icon: '🛡️' },
                { id: 'gold', name: 'Gold Investment', icon: '🥇' },
                { id: 'crypto', name: 'Cryptocurrency', icon: '🪙' },
                { id: 'emergency-fund', name: 'Emergency Fund', icon: '🆘' },
                { id: 'retirement', name: 'Retirement Fund', icon: '🏖️' },
                { id: 'other-savings', name: 'Other Savings', icon: '💎' }
            ]
        };

        // Function to get dynamic savings categories including active goals
        function getDynamicSavingsCategories() {
            const baseSavings = [...categories.savings];
            
            // Add active goals as savings categories
            goals.forEach(goal => {
                const goalSaved = calculateGoalProgress(goal.id);
                
                // Only show goal category if not yet completed
                if (goalSaved < goal.amount) {
                    baseSavings.push({
                        id: `goal-${goal.id}`,
                        name: `${goal.name} (₹${goalSaved.toLocaleString()}/₹${goal.amount.toLocaleString()})`,
                        icon: '🎯',
                        isGoal: true,
                        goalId: goal.id
                    });
                }
            });
            
            return baseSavings;
        };

        // Calculate goal progress from transactions
        function calculateGoalProgress(goalId) {
            return transactions
                .filter(t => t.type === 'savings' && t.category === `goal-${goalId}`)
                .reduce((sum, t) => sum + t.amount, 0);
        }

        // 50/30/20 Rule Categories
        const ruleCategories = {
            needs: ['rent', 'groceries', 'utilities', 'healthcare', 'transport', 'petrol', 'insurance', 'taxes'],
            wants: ['entertainment', 'dining', 'shopping', 'travel', 'gadgets', 'clothing', 'beauty', 'gifts', 'subscriptions', 'fitness'],
            savings: ['mutual-funds', 'stock-market', 'fixed-deposit', 'ppf', 'gold', 'crypto', 'emergency-fund', 'retirement', 'other-savings']
        };

        // Category Color Functions
        function getCategoryColorClass(categoryId, type) {
            if (type === 'income') return 'income-category';
            if (type === 'savings') return 'savings-category';
            
            // For expenses, check if it's needs or wants
            if (ruleCategories.needs.includes(categoryId)) return 'needs-category';
            if (ruleCategories.wants.includes(categoryId)) return 'wants-category';
            
            return 'needs-category'; // Default to needs for unknown categories
        }

        function getCategoryBorderClass(categoryId, type) {
            if (type === 'income') return 'income-border';
            if (type === 'savings') return 'savings-border';
            
            // For expenses, check if it's needs or wants
            if (ruleCategories.needs.includes(categoryId)) return 'needs-border';
            if (ruleCategories.wants.includes(categoryId)) return 'wants-border';
            
            return 'needs-border'; // Default to needs for unknown categories
        }
        
        // Initialize app
        document.addEventListener('DOMContentLoaded', function() {
            loadAllData();
            initializeApp();
        });

        function loadAllData() {
            try {
                const savedTransactions = localStorage.getItem('budgetTracker_transactions');
                transactions = savedTransactions ? JSON.parse(savedTransactions) : [];
                
                const savedGoals = localStorage.getItem('budgetTracker_goals');
                goals = savedGoals ? JSON.parse(savedGoals) : [];
                
                const savedBudgets = localStorage.getItem('budgetTracker_budgets');
                budgets = savedBudgets ? JSON.parse(savedBudgets) : [];
                
                const savedCurrency = localStorage.getItem('budgetTracker_currency');
                if (savedCurrency) {
                    currentCurrency = JSON.parse(savedCurrency);
                }
                
                console.log(`Loaded ${transactions.length} transactions, ${goals.length} goals, ${budgets.length} budgets`);
            } catch (error) {
                console.error('Error loading data:', error);
                transactions = [];
                goals = [];
                budgets = [];
            }
        }

        function saveAllData() {
            try {
                localStorage.setItem('budgetTracker_transactions', JSON.stringify(transactions));
                localStorage.setItem('budgetTracker_goals', JSON.stringify(goals));
                localStorage.setItem('budgetTracker_budgets', JSON.stringify(budgets));
                localStorage.setItem('budgetTracker_currency', JSON.stringify(currentCurrency));
            } catch (error) {
                console.error('Error saving data:', error);
                showNotification('Error saving data. Please try again.', 'error');
            }
        }

        function initializeApp() {
            document.getElementById('transaction-date').valueAsDate = new Date();
            updateCategoryOptions();
            updateCurrencyDisplay();
            loadDashboardLayout();
            updateDashboard();
            renderTransactionsList();
            renderGoals();
            renderBudgets();
            updateFilterOptions();
            showSection('dashboard');
            initializeTheme();
            setMinDateForGoals();
            initializePullToRefresh();
            initializeSwipeGestures();
        }

        function setMinDateForGoals() {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('goal-date').min = today;
        }

        // Navigation Functions
        function showSection(sectionName) {
            // Hide all sections
            document.querySelectorAll('.section').forEach(section => {
                section.classList.add('hidden');
            });
            
            // Show target section
            const targetSection = document.getElementById(sectionName + '-section');
            if (targetSection) {
                targetSection.classList.remove('hidden');
                targetSection.classList.add('slide-in');
            }
            
            // Update navigation active state
            updateNavigation(sectionName);
            currentSection = sectionName;
            
            // Update floating button visibility
            updateFloatingButtonVisibility();
            
            // Update specific sections
            if (sectionName === 'insights') {
                updateInsightsSection();
            }
        }

        function updateNavigation(activeSection) {
            // Remove active class from all nav buttons
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to current section buttons
            document.querySelectorAll(`[data-section="${activeSection}"]`).forEach(btn => {
                btn.classList.add('active');
            });
        }

        function toggleMobileMenu() {
            const mobileMenu = document.getElementById('mobile-menu');
            mobileMenu.classList.toggle('open');
        }

        // Theme Functions
        function initializeTheme() {
            const savedTheme = localStorage.getItem('budgetTracker_theme');
            if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }

        // Transaction Form Handling
        function updateCategoryOptions() {
            const type = document.getElementById('transaction-type').value;
            const categorySelect = document.getElementById('transaction-category');
            
            categorySelect.innerHTML = '';
            
            // Get appropriate categories based on type
            const categoryList = type === 'savings' ? getDynamicSavingsCategories() : categories[type];
            
            categoryList.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = `${category.icon} ${category.name}`;
                categorySelect.appendChild(option);
            });
            
            selectedCategory = categoryList[0].id;
            categorySelect.value = selectedCategory;
            updateCategoryGrid();
        }

        function updateCategoryGrid() {
            const type = document.getElementById('transaction-type').value;
            const grid = document.getElementById('category-grid');
            
            // Get appropriate categories based on type
            const categoryList = type === 'savings' ? getDynamicSavingsCategories() : categories[type];
            
            grid.innerHTML = categoryList.map(category => {
                const colorClass = getCategoryColorClass(category.id, type);
                const isSelected = category.id === selectedCategory;
                
                return `
                    <div class="category-card ${isSelected ? `selected ${colorClass}` : ''}" 
                         onclick="selectCategory('${category.id}')">
                        <div class="category-icon">${category.icon}</div>
                        <div class="text-xs font-medium mt-2">${category.name}</div>
                    </div>
                `;
            }).join('');
        }

        function selectCategory(categoryId) {
            selectedCategory = categoryId;
            document.getElementById('transaction-category').value = categoryId;
            updateCategoryGrid();
        }

        function cancelEdit() {
            editingTransactionId = null;
            document.getElementById('cancel-edit-btn').classList.add('hidden');
            document.getElementById('transaction-form').reset();
            document.getElementById('transaction-date').valueAsDate = new Date();
            selectedCategory = categories[document.getElementById('transaction-type').value][0].id;
            updateCategoryGrid();
        }

        // Transaction Form Submit
        document.getElementById('transaction-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const type = document.getElementById('transaction-type').value;
            const category = selectedCategory;
            const amount = parseFloat(document.getElementById('transaction-amount').value);
            const date = document.getElementById('transaction-date').value;
            const description = document.getElementById('transaction-description').value;
            const paymentMode = document.getElementById('payment-mode').value;
            const tagsInput = document.getElementById('transaction-tags').value;
            const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim().replace(/^#/, '')).filter(tag => tag) : [];
            
            const transaction = {
                id: editingTransactionId || Date.now(),
                timestamp: Date.now(),
                type,
                category,
                amount,
                date,
                description,
                paymentMode,
                tags
            };
            
            if (editingTransactionId) {
                const index = transactions.findIndex(t => t.id === editingTransactionId);
                transactions[index] = transaction;
                showNotification('Transaction updated successfully!', 'success');
                cancelEdit();
            } else {
                transactions.push(transaction);
                showNotification('Transaction added successfully!', 'success');
                lastTransactionId = transaction.id;
                // Start individual transaction edit timer
                startTransactionEditTimer(transaction.id);
            }
            
            // Handle goal completion
            if (transaction.type === 'savings' && transaction.category.startsWith('goal-')) {
                const goalId = parseInt(transaction.category.replace('goal-', ''));
                const goal = goals.find(g => g.id === goalId);
                if (goal) {
                    const totalSaved = calculateGoalProgress(goalId);
                    if (totalSaved >= goal.amount) {
                        showNotification(`🎉 Congratulations! Goal "${goal.name}" completed!`, 'success');
                        // Update category options to remove completed goal
                        updateCategoryOptions();
                    }
                }
            }
            
            saveAllData();
            updateDashboard();
            renderTransactionsList();
            renderGoals();
            renderBudgets(); // Update budgets to reflect new spending
            updateFilterOptions();
            updateInsightsSection(); // Update insights with new data
            
            // Reset form
            document.getElementById('transaction-form').reset();
            document.getElementById('transaction-date').valueAsDate = new Date();
            selectedCategory = categories[type][0].id;
            updateCategoryGrid();
        });

        // Edit Timer Functions
        function startTransactionEditTimer(transactionId) {
            // Clear existing timer for this transaction
            if (transactionEditTimers.has(transactionId)) {
                clearTimeout(transactionEditTimers.get(transactionId));
            }
            
            // Set new timer for 1 minute
            const timer = setTimeout(() => {
                transactionEditTimers.delete(transactionId);
                renderTransactionsList(); // Re-render to update edit button states
            }, 60000); // 60 seconds
            
            transactionEditTimers.set(transactionId, timer);
        }

        function canEditTransaction(transactionId) {
            return transactionEditTimers.has(transactionId);
        }

        // Dashboard Functions
        function updateDashboard() {
            const hasData = transactions.length > 0;
            
            document.getElementById('welcome-section').style.display = hasData ? 'none' : 'block';
            document.getElementById('quick-add-section').style.display = hasData ? 'block' : 'none';
            document.getElementById('summary-cards').style.display = hasData ? 'grid' : 'none';
            document.getElementById('charts-section').style.display = hasData ? 'grid' : 'none';
            document.getElementById('rule-section').style.display = hasData ? 'block' : 'none';
            document.getElementById('reset-button-container').style.display = hasData ? 'block' : 'none';
            
            if (hasData) {
                applyDashboardLayout();
            }
            
            if (!hasData) return;
            
            const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            const totalSavings = transactions.filter(t => t.type === 'savings').reduce((sum, t) => sum + t.amount, 0);
            const balance = totalIncome - totalExpenses;
            
            document.getElementById('total-income').textContent = `${currentCurrency.symbol}${totalIncome.toLocaleString()}`;
            document.getElementById('total-expenses').textContent = `${currentCurrency.symbol}${totalExpenses.toLocaleString()}`;
            document.getElementById('total-savings').textContent = `${currentCurrency.symbol}${totalSavings.toLocaleString()}`;
            document.getElementById('balance').textContent = `${currentCurrency.symbol}${balance.toLocaleString()}`;
            
            update50_30_20Rule();
            updateCharts();
        }

        function update50_30_20Rule() {
            const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            const totalSavings = transactions.filter(t => t.type === 'savings').reduce((sum, t) => sum + t.amount, 0);
            
            if (totalIncome === 0) return;
            
            // Calculate needs, wants, and savings
            const needsAmount = transactions.filter(t => t.type === 'expense' && ruleCategories.needs.includes(t.category)).reduce((sum, t) => sum + t.amount, 0);
            const wantsAmount = transactions.filter(t => t.type === 'expense' && ruleCategories.wants.includes(t.category)).reduce((sum, t) => sum + t.amount, 0);
            
            const needsPercentage = (needsAmount / totalIncome) * 100;
            const wantsPercentage = (wantsAmount / totalIncome) * 100;
            const savingsPercentage = (totalSavings / totalIncome) * 100;
            
            // Update display
            document.getElementById('needs-percentage').textContent = `${needsPercentage.toFixed(1)}%`;
            document.getElementById('wants-percentage').textContent = `${wantsPercentage.toFixed(1)}%`;
            document.getElementById('savings-percentage').textContent = `${savingsPercentage.toFixed(1)}%`;
            
            document.getElementById('needs-amount').textContent = `${currentCurrency.symbol}${needsAmount.toLocaleString()}`;
            document.getElementById('wants-amount').textContent = `${currentCurrency.symbol}${wantsAmount.toLocaleString()}`;
            document.getElementById('savings-rule-amount').textContent = `${currentCurrency.symbol}${totalSavings.toLocaleString()}`;
            
            // Update progress bars
            document.getElementById('needs-progress').style.width = `${Math.min(needsPercentage, 100)}%`;
            document.getElementById('wants-progress').style.width = `${Math.min(wantsPercentage, 100)}%`;
            document.getElementById('savings-progress').style.width = `${Math.min(savingsPercentage, 100)}%`;
            
            // Update status
            const ruleStatus = document.getElementById('rule-status');
            if (needsPercentage <= 50 && wantsPercentage <= 30 && savingsPercentage >= 20) {
                ruleStatus.className = 'rule-indicator good';
                ruleStatus.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Excellent!';
            } else if (needsPercentage <= 60 && wantsPercentage <= 40 && savingsPercentage >= 10) {
                ruleStatus.className = 'rule-indicator warning';
                ruleStatus.innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i>Good';
            } else {
                ruleStatus.className = 'rule-indicator warning';
                ruleStatus.innerHTML = '<i class="fas fa-chart-line mr-2"></i>Improving';
            }
        }

        function updateCharts() {
            // Destroy existing charts
            Object.values(charts).forEach(chart => {
                if (chart) chart.destroy();
            });
            
            const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            const totalSavings = transactions.filter(t => t.type === 'savings').reduce((sum, t) => sum + t.amount, 0);

            // Expenses vs Income Chart
            const expensesVsIncomeCtx = document.getElementById('expenses-vs-income-chart').getContext('2d');
            charts.expensesVsIncome = new Chart(expensesVsIncomeCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Income', 'Expenses'],
                    datasets: [{
                        data: [totalIncome, totalExpenses],
                        backgroundColor: ['#10b981', '#ef4444'],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                        }
                    }
                }
            });

            // Expenses vs Savings Chart
            const expensesVsSavingsCtx = document.getElementById('expenses-vs-savings-chart').getContext('2d');
            charts.expensesVsSavings = new Chart(expensesVsSavingsCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Expenses', 'Savings'],
                    datasets: [{
                        data: [totalExpenses, totalSavings],
                        backgroundColor: ['#ef4444', '#3b82f6'],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                        }
                    }
                }
            });

            // Combined Overview Chart
            const combinedOverviewCtx = document.getElementById('combined-overview-chart').getContext('2d');
            charts.combinedOverview = new Chart(combinedOverviewCtx, {
                type: 'bar',
                data: {
                    labels: ['Financial Overview'],
                    datasets: [{
                        label: 'Income',
                        data: [totalIncome],
                        backgroundColor: '#10b981'
                    }, {
                        label: 'Expenses',
                        data: [totalExpenses],
                        backgroundColor: '#ef4444'
                    }, {
                        label: 'Savings',
                        data: [totalSavings],
                        backgroundColor: '#3b82f6'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    }
                }
            });

            // Top Expense Categories Chart
            const topExpensesCtx = document.getElementById('top-expenses-chart').getContext('2d');
            const categoryData = getCategoryData();
            
            charts.topExpenses = new Chart(topExpensesCtx, {
                type: 'bar',
                data: {
                    labels: categoryData.labels.slice(0, 5), // Top 5 categories
                    datasets: [{
                        label: 'Amount Spent',
                        data: categoryData.data.slice(0, 5),
                        backgroundColor: [
                            '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }

        function getCategoryData() {
            const categoryTotals = {};
            
            transactions.filter(t => t.type === 'expense').forEach(t => {
                const category = findCategoryById(t.category, 'expense');
                const categoryName = category ? category.name : 'Other';
                categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + t.amount;
            });
            
            // Sort by amount (descending)
            const sortedEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
            
            return {
                labels: sortedEntries.map(entry => entry[0]),
                data: sortedEntries.map(entry => entry[1])
            };
        }

        function renderTransactionsList() {
            const container = document.getElementById('transactions-list');
            
            if (transactions.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                        <i class="fas fa-receipt text-4xl mb-4"></i>
                        <p>No transactions yet. Add your first transaction!</p>
                    </div>
                `;
                return;
            }
            
            const filteredTransactions = getFilteredTransactions();
            const sortedTransactions = [...filteredTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));
            
            container.innerHTML = sortedTransactions.map(transaction => {
                const category = findCategoryById(transaction.category, transaction.type);
                const typeColor = transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 
                                transaction.type === 'expense' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400';
                const typeIcon = transaction.type === 'income' ? 'fa-arrow-up' : 
                               transaction.type === 'expense' ? 'fa-arrow-down' : 'fa-piggy-bank';
                
                const tagsHtml = transaction.tags && transaction.tags.length > 0 
                    ? transaction.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')
                    : '';
                
                const canEdit = canEditTransaction(transaction.id);
                const editButtonClass = canEdit ? '' : 'btn-disabled';
                
                const borderClass = getCategoryBorderClass(transaction.category, transaction.type);
                
                return `
                    <div class="transaction-item bg-gray-50 dark:bg-gray-700 rounded-lg ${borderClass}" data-transaction-id="${transaction.id}">
                        <!-- Swipe Actions -->
                        <div class="swipe-actions right" style="width: 80px;">
                            <div class="swipe-action-btn" onclick="editTransaction(${transaction.id})" ${!canEdit ? 'style="opacity: 0.5; pointer-events: none;"' : ''}>
                                <i class="fas fa-edit"></i>
                            </div>
                        </div>
                        <div class="swipe-actions left" style="width: 80px;">
                            <div class="swipe-action-btn" onclick="deleteTransaction(${transaction.id})">
                                <i class="fas fa-trash"></i>
                            </div>
                        </div>
                        
                        <!-- Transaction Content -->
                        <div class="transaction-content flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                            <div class="flex items-center space-x-4">
                                <div class="text-2xl">${category.icon}</div>
                                <div>
                                    <h4 class="font-semibold text-gray-800 dark:text-white">${category.name}</h4>
                                    <p class="text-sm text-gray-600 dark:text-gray-300">${transaction.description || 'No description'}</p>
                                    <div class="flex items-center space-x-2 mt-1">
                                        <p class="text-xs text-gray-500 dark:text-gray-400">${new Date(transaction.date).toLocaleDateString()}</p>
                                        <span class="text-xs text-gray-400">•</span>
                                        <p class="text-xs text-gray-500 dark:text-gray-400">${transaction.paymentMode.toUpperCase()}</p>
                                    </div>
                                    ${tagsHtml ? `<div class="mt-1">${tagsHtml}</div>` : ''}
                                </div>
                            </div>
                            <div class="flex items-center space-x-3">
                                <div class="text-right">
                                    <p class="font-bold ${typeColor}">
                                        <i class="fas ${typeIcon} mr-1"></i>
                                        ${currentCurrency.symbol}${transaction.amount.toLocaleString()}
                                    </p>
                                </div>
                                <div class="flex space-x-2 md:block hidden">
                                    <button onclick="editTransaction(${transaction.id})" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 ${editButtonClass}" ${!canEdit ? 'title="Edit time expired"' : ''}>
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="deleteTransaction(${transaction.id})" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Initialize swipe gestures for new transaction items
            initializeSwipeGestures();
        }

        function findCategoryById(categoryId, type) {
            // Check if it's a goal category
            if (categoryId.startsWith('goal-')) {
                const goalId = parseInt(categoryId.replace('goal-', ''));
                const goal = goals.find(g => g.id === goalId);
                if (goal) {
                    const goalSaved = calculateGoalProgress(goalId);
                    return {
                        id: categoryId,
                        name: `${goal.name} (₹${goalSaved.toLocaleString()}/₹${goal.amount.toLocaleString()})`,
                        icon: '🎯'
                    };
                }
            }
            
            const categoryList = type === 'savings' ? getDynamicSavingsCategories() : (categories[type] || categories.expense);
            return categoryList.find(c => c.id === categoryId) || { id: 'other', name: 'Other', icon: '❓' };
        }

        function editTransaction(id) {
            if (!canEditTransaction(id)) {
                showNotification('Edit time has expired for this transaction.', 'warning');
                return;
            }

            const transaction = transactions.find(t => t.id === id);
            if (!transaction) return;
            
            editingTransactionId = id;
            document.getElementById('transaction-type').value = transaction.type;
            updateCategoryOptions();
            document.getElementById('transaction-category').value = transaction.category;
            selectedCategory = transaction.category;
            updateCategoryGrid();
            document.getElementById('transaction-amount').value = transaction.amount;
            document.getElementById('transaction-date').value = transaction.date;
            document.getElementById('transaction-description').value = transaction.description || '';
            document.getElementById('payment-mode').value = transaction.paymentMode || 'upi';
            document.getElementById('transaction-tags').value = transaction.tags ? transaction.tags.map(tag => `#${tag}`).join(', ') : '';
            
            document.getElementById('cancel-edit-btn').classList.remove('hidden');
            showSection('transactions');
            document.getElementById('transaction-amount').focus();
        }

        function deleteTransaction(id) {
            const customConfirm = document.createElement('div');
            customConfirm.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
            customConfirm.innerHTML = `
                <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4">
                    <div class="text-center">
                        <i class="fas fa-exclamation-triangle text-4xl text-red-600 mb-4"></i>
                        <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Delete Transaction</h3>
                        <p class="text-gray-600 dark:text-gray-300 mb-6">Are you sure you want to delete this transaction? This action cannot be undone.</p>
                        <div class="flex space-x-4">
                            <button onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors">
                                Cancel
                            </button>
                            <button onclick="confirmDeleteTransaction(${id}); this.closest('.fixed').remove()" class="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(customConfirm);
        }

        function confirmDeleteTransaction(id) {
            transactions = transactions.filter(t => t.id !== id);
            
            // Clear edit timer for this transaction
            if (transactionEditTimers.has(id)) {
                clearTimeout(transactionEditTimers.get(id));
                transactionEditTimers.delete(id);
            }
            
            saveAllData();
            updateDashboard();
            renderTransactionsList();
            updateFilterOptions();
            showNotification('Transaction deleted successfully!', 'success');
        }

        // Filter Functions
        function updateFilterOptions() {
            const categoryFilter = document.getElementById('filter-category');
            categoryFilter.innerHTML = '<option value="all">All Categories</option>';
            
            const allCategories = new Set();
            transactions.forEach(t => {
                const category = findCategoryById(t.category, t.type);
                allCategories.add(`${category.name}|${t.category}`);
            });
            
            Array.from(allCategories).sort().forEach(categoryData => {
                const [name, id] = categoryData.split('|');
                const option = document.createElement('option');
                option.value = id;
                option.textContent = name;
                categoryFilter.appendChild(option);
            });
        }

        function getFilteredTransactions() {
            let filtered = [...transactions];
            
            const typeFilter = document.getElementById('filter-type').value;
            const categoryFilter = document.getElementById('filter-category').value;
            const paymentFilter = document.getElementById('filter-payment').value;
            const dateFilter = document.getElementById('filter-date').value;
            const tagsFilter = document.getElementById('filter-tags').value.toLowerCase();
            
            if (typeFilter !== 'all') {
                filtered = filtered.filter(t => t.type === typeFilter);
            }
            
            if (categoryFilter !== 'all') {
                filtered = filtered.filter(t => t.category === categoryFilter);
            }
            
            if (paymentFilter !== 'all') {
                filtered = filtered.filter(t => t.paymentMode === paymentFilter);
            }
            
            if (dateFilter !== 'all') {
                const now = new Date();
                const today = now.toISOString().split('T')[0];
                
                filtered = filtered.filter(t => {
                    const transactionDate = new Date(t.date);
                    
                    switch (dateFilter) {
                        case 'today':
                            return t.date === today;
                        case 'week':
                            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                            return transactionDate >= weekAgo;
                        case 'month':
                            return transactionDate.getMonth() === now.getMonth() && 
                                   transactionDate.getFullYear() === now.getFullYear();
                        case 'year':
                            return transactionDate.getFullYear() === now.getFullYear();
                        default:
                            return true;
                    }
                });
            }
            
            if (tagsFilter) {
                filtered = filtered.filter(t => 
                    t.tags && t.tags.some(tag => tag.toLowerCase().includes(tagsFilter))
                );
            }
            
            return filtered;
        }

        function filterTransactions() {
            renderTransactionsList();
        }



        // Goals Functions
        function renderGoals() {
            const container = document.getElementById('goals-list');
            
            if (goals.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-12 text-gray-500 dark:text-gray-400">
                        <i class="fas fa-bullseye text-4xl mb-4"></i>
                        <p>No goals set yet. Create your first savings goal!</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = goals.map(goal => {
                const actualSaved = calculateGoalProgress(goal.id);
                const progress = Math.min((actualSaved / goal.amount) * 100, 100);
                const daysLeft = Math.ceil((new Date(goal.date) - new Date()) / (1000 * 60 * 60 * 24));
                const isCompleted = actualSaved >= goal.amount;
                
                return `
                    <div class="bg-white dark:bg-gray-700 rounded-xl p-6">
                        <div class="flex justify-between items-start mb-4">
                            <div class="flex items-center space-x-3">
                                <div class="text-2xl">🎯</div>
                                <div>
                                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white">${goal.name} ${isCompleted ? '🎉' : ''}</h3>
                                    <p class="text-sm text-gray-600 dark:text-gray-300">Target: ${currentCurrency.symbol}${goal.amount.toLocaleString()}</p>
                                    ${isCompleted ? '<p class="text-sm text-green-600 dark:text-green-400 font-semibold">✅ Goal Completed!</p>' : ''}
                                </div>
                            </div>
                            <button onclick="deleteGoal(${goal.id})" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        
                        <div class="mb-4">
                            <div class="flex justify-between text-sm mb-2">
                                <span>Saved: ${currentCurrency.symbol}${actualSaved.toLocaleString()}</span>
                                <span>Progress: ${progress.toFixed(1)}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill ${progress > 100 ? 'danger' : progress > 80 ? 'warning' : ''}" 
                                     style="width: ${Math.min(progress, 100)}%"></div>
                            </div>
                        </div>
                        
                        <div class="text-sm ${isCompleted ? 'text-green-600 dark:text-green-400' : daysLeft < 0 ? 'text-red-600 dark:text-red-400' : daysLeft < 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-300'}">
                            ${isCompleted ? '🎉 Goal Completed!' : daysLeft > 0 ? `📅 ${daysLeft} days remaining` : '⏰ Goal overdue'}
                        </div>
                    </div>
                `;
            }).join('');
        }

        function showAddGoalModal() {
            document.getElementById('add-goal-modal').classList.remove('hidden');
        }

        function hideAddGoalModal() {
            document.getElementById('add-goal-modal').classList.add('hidden');
            document.getElementById('goal-form').reset();
        }

        document.getElementById('goal-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const goalDate = document.getElementById('goal-date').value;
            const today = new Date().toISOString().split('T')[0];
            
            if (goalDate <= today) {
                showNotification('Goal date must be in the future!', 'error');
                return;
            }
            
            const goalName = document.getElementById('goal-name').value;
            const goalAmount = parseFloat(document.getElementById('goal-amount').value);
            
            const goal = {
                id: Date.now(),
                name: goalName,
                amount: goalAmount,
                date: goalDate,
                saved: 0,
                created: new Date().toISOString()
            };
            
            goals.push(goal);
            saveAllData();
            renderGoals();
            updateDashboard();
            renderTransactionsList();
            updateCategoryOptions(); // Update savings categories to include new goal
            hideAddGoalModal();
            showNotification(`Goal "${goalName}" created! You can now save money towards it in the Transactions section.`, 'success');
        });

        function deleteGoal(id) {
            const customConfirm = document.createElement('div');
            customConfirm.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
            customConfirm.innerHTML = `
                <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4">
                    <div class="text-center">
                        <i class="fas fa-exclamation-triangle text-4xl text-red-600 mb-4"></i>
                        <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Delete Goal</h3>
                        <p class="text-gray-600 dark:text-gray-300 mb-6">Are you sure you want to delete this goal? This action cannot be undone.</p>
                        <div class="flex space-x-4">
                            <button onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors">
                                Cancel
                            </button>
                            <button onclick="confirmDeleteGoal(${id}); this.closest('.fixed').remove()" class="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(customConfirm);
        }

        function confirmDeleteGoal(id) {
            goals = goals.filter(g => g.id !== id);
            saveAllData();
            renderGoals();
            showNotification('Goal deleted successfully!', 'success');
        }

        // Budget Functions
        function renderBudgets() {
            const container = document.getElementById('budgets-list');
            
            if (budgets.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-12 text-gray-500 dark:text-gray-400">
                        <i class="fas fa-chart-pie text-4xl mb-4"></i>
                        <p>No budgets set yet. Create your first budget!</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = budgets.map(budget => {
                const spent = transactions
                    .filter(t => t.type === 'expense' && t.category === budget.category)
                    .reduce((sum, t) => sum + t.amount, 0);
                
                const progress = (spent / budget.limit) * 100;
                const category = findCategoryById(budget.category, 'expense');
                
                return `
                    <div class="bg-white dark:bg-gray-700 rounded-xl p-6">
                        <div class="flex justify-between items-start mb-4">
                            <div class="flex items-center space-x-3">
                                <div class="text-2xl">${category.icon}</div>
                                <div>
                                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white">${budget.customName || category.name}</h3>
                                    <p class="text-sm text-gray-600 dark:text-gray-300">Monthly Budget</p>
                                </div>
                            </div>
                            <button onclick="deleteBudget(${budget.id})" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        
                        <div class="mb-4">
                            <div class="flex justify-between text-sm mb-2">
                                <span>Spent: ${currentCurrency.symbol}${spent.toLocaleString()}</span>
                                <span>Limit: ${currentCurrency.symbol}${budget.limit.toLocaleString()}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill ${progress > 100 ? 'danger' : progress > 80 ? 'warning' : ''}" 
                                     style="width: ${Math.min(progress, 100)}%"></div>
                            </div>
                        </div>
                        
                        <div class="text-sm ${progress > 100 ? 'text-red-600 dark:text-red-400' : progress > 80 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}">
                            ${progress > 100 ? '⚠️ Over budget!' : progress > 80 ? '⚠️ Close to limit' : '✅ On track'}
                        </div>
                    </div>
                `;
            }).join('');
        }

        function showAddBudgetModal() {
            document.getElementById('add-budget-modal').classList.remove('hidden');
        }

        function hideAddBudgetModal() {
            document.getElementById('add-budget-modal').classList.add('hidden');
            document.getElementById('budget-form').reset();
            document.getElementById('custom-category-input').classList.add('hidden');
        }

        // Handle custom category selection
        document.getElementById('budget-category').addEventListener('change', function() {
            const customInput = document.getElementById('custom-category-input');
            if (this.value === 'other-expense') {
                customInput.classList.remove('hidden');
            } else {
                customInput.classList.add('hidden');
            }
        });

        document.getElementById('budget-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const categoryValue = document.getElementById('budget-category').value;
            const customName = document.getElementById('custom-category-name').value;
            
            const budget = {
                id: Date.now(),
                category: categoryValue,
                customName: categoryValue === 'other-expense' ? customName : null,
                limit: parseFloat(document.getElementById('budget-limit').value),
                created: new Date().toISOString()
            };
            
            budgets.push(budget);
            saveAllData();
            renderBudgets();
            hideAddBudgetModal();
            showNotification('Budget set successfully!', 'success');
        });

        function deleteBudget(id) {
            const customConfirm = document.createElement('div');
            customConfirm.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
            customConfirm.innerHTML = `
                <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4">
                    <div class="text-center">
                        <i class="fas fa-exclamation-triangle text-4xl text-red-600 mb-4"></i>
                        <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Delete Budget</h3>
                        <p class="text-gray-600 dark:text-gray-300 mb-6">Are you sure you want to delete this budget? This action cannot be undone.</p>
                        <div class="flex space-x-4">
                            <button onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors">
                                Cancel
                            </button>
                            <button onclick="confirmDeleteBudget(${id}); this.closest('.fixed').remove()" class="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(customConfirm);
        }

        function confirmDeleteBudget(id) {
            budgets = budgets.filter(b => b.id !== id);
            saveAllData();
            renderBudgets();
            showNotification('Budget deleted successfully!', 'success');
        }

        // AI Insights Functions
        function updateInsightsSection() {
            if (transactions.length === 0) {
                document.getElementById('rule-insight-content').innerHTML = 'Add some transactions to see your progress toward the 50/30/20 rule!';
                document.getElementById('ai-recommendations').innerHTML = `
                    <div class="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg border-l-4 border-blue-500">
                        <h4 class="font-semibold text-blue-800 dark:text-blue-200">💡 Smart Tip</h4>
                        <p class="text-blue-700 dark:text-blue-300 text-sm mt-1">Add some transactions to get personalized AI insights and recommendations!</p>
                    </div>
                `;
                // Reset other sections
                document.getElementById('spending-trends').innerHTML = '<div class="text-sm text-gray-600 dark:text-gray-300">Add transactions to see detailed spending analysis</div>';
                document.getElementById('goal-insights').innerHTML = '<div class="text-sm text-gray-600 dark:text-gray-300">Set goals to see progress insights</div>';
                updateMonthlySummary();
                return;
            }

            const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            const totalSavings = transactions.filter(t => t.type === 'savings').reduce((sum, t) => sum + t.amount, 0);

            // Update 50/30/20 rule insight
            updateRuleInsight();

            // Calculate metrics
            const spendingEfficiency = totalIncome > 0 ? Math.max(0, Math.min(100, ((totalIncome - totalExpenses) / totalIncome) * 100)) : 0;
            const savingsConsistency = totalIncome > 0 ? Math.min(100, (totalSavings / totalIncome) * 100 * 5) : 0; // Amplified for better scoring
            const budgetAdherence = calculateBudgetAdherence();
            const financialHealth = Math.round((spendingEfficiency + savingsConsistency + budgetAdherence) / 3);

            document.getElementById('spending-efficiency').textContent = `${Math.round(spendingEfficiency)}%`;
            document.getElementById('savings-consistency').textContent = `${Math.round(savingsConsistency)}%`;
            document.getElementById('budget-adherence').textContent = `${Math.round(budgetAdherence)}%`;
            document.getElementById('financial-health').textContent = `${financialHealth}%`;

            // Update enhanced sections
            updateSpendingTrends();
            updateGoalInsights();
            updateMonthlySummary();

            // Generate recommendations
            const recommendations = generateRecommendations();
            document.getElementById('ai-recommendations').innerHTML = recommendations.map(rec => `
                <div class="bg-${rec.color}-50 dark:bg-${rec.color}-900 p-4 rounded-lg border-l-4 border-${rec.color}-500">
                    <h4 class="font-semibold text-${rec.color}-800 dark:text-${rec.color}-200">${rec.icon} ${rec.title}</h4>
                    <p class="text-${rec.color}-700 dark:text-${rec.color}-300 text-sm mt-1">${rec.message}</p>
                </div>
            `).join('');
        }

        function updateSpendingTrends() {
            const expenseCategories = {};
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            
            transactions.filter(t => t.type === 'expense').forEach(t => {
                const transactionDate = new Date(t.date);
                const category = findCategoryById(t.category, 'expense');
                const categoryName = category.name;
                
                if (!expenseCategories[categoryName]) {
                    expenseCategories[categoryName] = { total: 0, thisMonth: 0, icon: category.icon };
                }
                
                expenseCategories[categoryName].total += t.amount;
                
                if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
                    expenseCategories[categoryName].thisMonth += t.amount;
                }
            });

            const sortedCategories = Object.entries(expenseCategories)
                .sort((a, b) => b[1].total - a[1].total)
                .slice(0, 3);

            const trendsHtml = sortedCategories.map(([name, data]) => `
                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div class="flex items-center space-x-3">
                        <span class="text-xl">${data.icon}</span>
                        <div>
                            <div class="font-medium text-gray-800 dark:text-white">${name}</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400">This month: ₹${data.thisMonth.toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="font-bold text-gray-800 dark:text-white">₹${data.total.toLocaleString()}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">Total</div>
                    </div>
                </div>
            `).join('');

            document.getElementById('spending-trends').innerHTML = trendsHtml || '<div class="text-sm text-gray-600 dark:text-gray-300">No expense data available</div>';
        }

        function updateGoalInsights() {
            if (goals.length === 0) {
                document.getElementById('goal-insights').innerHTML = '<div class="text-sm text-gray-600 dark:text-gray-300">Set goals to see progress insights</div>';
                return;
            }

            const goalInsights = goals.map(goal => {
                const actualSaved = calculateGoalProgress(goal.id);
                const progress = Math.min((actualSaved / goal.amount) * 100, 100);
                const daysLeft = Math.ceil((new Date(goal.date) - new Date()) / (1000 * 60 * 60 * 24));
                const dailyTarget = daysLeft > 0 ? (goal.amount - actualSaved) / daysLeft : 0;
                
                let status = '🎯';
                let statusText = 'On track';
                
                if (progress >= 100) {
                    status = '🎉';
                    statusText = 'Completed!';
                } else if (daysLeft < 0) {
                    status = '⏰';
                    statusText = 'Overdue';
                } else if (progress < 25 && daysLeft < 30) {
                    status = '⚠️';
                    statusText = 'Needs attention';
                }

                return `
                    <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div class="flex items-center space-x-3">
                            <span class="text-xl">${status}</span>
                            <div>
                                <div class="font-medium text-gray-800 dark:text-white">${goal.name}</div>
                                <div class="text-xs text-gray-500 dark:text-gray-400">${statusText}</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="font-bold text-gray-800 dark:text-white">${progress.toFixed(1)}%</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400">
                                ${daysLeft > 0 && actualSaved < goal.amount ? `₹${Math.round(dailyTarget)}/day` : 'Complete'}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            document.getElementById('goal-insights').innerHTML = goalInsights;
        }

        function updateMonthlySummary() {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            
            const monthlyIncome = transactions
                .filter(t => {
                    const date = new Date(t.date);
                    return t.type === 'income' && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
                })
                .reduce((sum, t) => sum + t.amount, 0);
                
            const monthlyExpenses = transactions
                .filter(t => {
                    const date = new Date(t.date);
                    return t.type === 'expense' && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
                })
                .reduce((sum, t) => sum + t.amount, 0);
                
            const monthlySavings = transactions
                .filter(t => {
                    const date = new Date(t.date);
                    return t.type === 'savings' && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
                })
                .reduce((sum, t) => sum + t.amount, 0);

            document.getElementById('month-income').textContent = `₹${monthlyIncome.toLocaleString()}`;
            document.getElementById('month-expenses').textContent = `₹${monthlyExpenses.toLocaleString()}`;
            document.getElementById('month-savings').textContent = `₹${monthlySavings.toLocaleString()}`;
        }

        function updateRuleInsight() {
            const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const totalSavings = transactions.filter(t => t.type === 'savings').reduce((sum, t) => sum + t.amount, 0);
            
            if (totalIncome === 0) {
                document.getElementById('rule-insight-content').innerHTML = 'Add some income transactions to see your 50/30/20 rule progress!';
                return;
            }
            
            // Calculate needs, wants, and savings
            const needsAmount = transactions.filter(t => t.type === 'expense' && ruleCategories.needs.includes(t.category)).reduce((sum, t) => sum + t.amount, 0);
            const wantsAmount = transactions.filter(t => t.type === 'expense' && ruleCategories.wants.includes(t.category)).reduce((sum, t) => sum + t.amount, 0);
            
            const needsPercentage = (needsAmount / totalIncome) * 100;
            const wantsPercentage = (wantsAmount / totalIncome) * 100;
            const savingsPercentage = (totalSavings / totalIncome) * 100;
            
            let status = '';
            let statusClass = '';
            
            if (needsPercentage <= 50 && wantsPercentage <= 30 && savingsPercentage >= 20) {
                status = '🎉 Excellent! You\'re following the 50/30/20 rule perfectly.';
                statusClass = 'text-green-600 dark:text-green-400';
            } else if (needsPercentage <= 60 && wantsPercentage <= 40 && savingsPercentage >= 10) {
                status = '👍 Good progress! You\'re close to the ideal 50/30/20 allocation.';
                statusClass = 'text-yellow-600 dark:text-yellow-400';
            } else {
                status = '⚠️ Your spending needs adjustment to follow the 50/30/20 rule.';
                statusClass = 'text-red-600 dark:text-red-400';
            }
            
            document.getElementById('rule-insight-content').innerHTML = `
                <div class="grid grid-cols-3 gap-4 mb-3">
                    <div class="text-center">
                        <div class="text-lg font-bold needs-color">${needsPercentage.toFixed(1)}%</div>
                        <div class="text-xs">Needs (Target: 50%)</div>
                    </div>
                    <div class="text-center">
                        <div class="text-lg font-bold wants-color">${wantsPercentage.toFixed(1)}%</div>
                        <div class="text-xs">Wants (Target: 30%)</div>
                    </div>
                    <div class="text-center">
                        <div class="text-lg font-bold savings-color">${savingsPercentage.toFixed(1)}%</div>
                        <div class="text-xs">Savings (Target: 20%)</div>
                    </div>
                </div>
                <div class="font-medium ${statusClass}">${status}</div>
            `;
        }

        function calculateBudgetAdherence() {
            if (budgets.length === 0) return 75; // Default score if no budgets set

            let totalAdherence = 0;
            budgets.forEach(budget => {
                const spent = transactions
                    .filter(t => t.type === 'expense' && t.category === budget.category)
                    .reduce((sum, t) => sum + t.amount, 0);
                
                const adherence = Math.max(0, Math.min(100, ((budget.limit - spent) / budget.limit) * 100));
                totalAdherence += adherence;
            });

            return totalAdherence / budgets.length;
        }

        function generateRecommendations() {
            const recommendations = [];
            const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            const totalSavings = transactions.filter(t => t.type === 'savings').reduce((sum, t) => sum + t.amount, 0);

            // Savings rate recommendation
            const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;
            if (savingsRate < 20) {
                recommendations.push({
                    icon: '🎯',
                    title: 'Boost Your Savings',
                    message: `You're saving ${savingsRate.toFixed(1)}% of your income. Try to reach the 20% target of the 50/30/20 rule for better financial health.`,
                    color: 'blue'
                });
            } else {
                recommendations.push({
                    icon: '🌟',
                    title: 'Excellent Savings!',
                    message: `Great job! You're saving ${savingsRate.toFixed(1)}% of your income, which exceeds the recommended 20%.`,
                    color: 'green'
                });
            }

            // Expense analysis
            const expenseCategories = {};
            transactions.filter(t => t.type === 'expense').forEach(t => {
                const category = findCategoryById(t.category, 'expense');
                expenseCategories[category.name] = (expenseCategories[category.name] || 0) + t.amount;
            });

            const topExpense = Object.entries(expenseCategories).sort((a, b) => b[1] - a[1])[0];
            if (topExpense && totalExpenses > 0) {
                const percentage = (topExpense[1] / totalExpenses) * 100;
                if (percentage > 30) {
                    recommendations.push({
                        icon: '💡',
                        title: 'Optimize Top Expense',
                        message: `${topExpense[0]} accounts for ${percentage.toFixed(1)}% of your expenses. Consider ways to reduce this category.`,
                        color: 'yellow'
                    });
                }
            }

            // Budget recommendations
            if (budgets.length === 0) {
                recommendations.push({
                    icon: '📊',
                    title: 'Set Up Budgets',
                    message: 'Create category budgets to better track and control your spending habits.',
                    color: 'purple'
                });
            }

            return recommendations.slice(0, 3); // Limit to 3 recommendations
        }

        // Reset Functions
        function showResetConfirmation() {
            document.getElementById('reset-modal').classList.remove('hidden');
        }

        function hideResetConfirmation() {
            document.getElementById('reset-modal').classList.add('hidden');
        }

        function resetAllData() {
            transactions = [];
            goals = [];
            budgets = [];
            
            // Clear all edit timers
            transactionEditTimers.forEach(timer => clearTimeout(timer));
            transactionEditTimers.clear();
            
            // Clear localStorage
            localStorage.removeItem('budgetTracker_transactions');
            localStorage.removeItem('budgetTracker_goals');
            localStorage.removeItem('budgetTracker_budgets');
            localStorage.removeItem('budgetTracker_layout');
            
            // Destroy charts
            Object.values(charts).forEach(chart => {
                if (chart) chart.destroy();
            });
            charts = {};
            
            updateDashboard();
            renderTransactionsList();
            renderGoals();
            renderBudgets();
            updateFilterOptions();
            
            hideResetConfirmation();
            showNotification('All data has been reset!', 'success');
        }

        // Quick Add Functions
        function quickAddTransaction(type) {
            // Pre-fill the form with the selected type
            document.getElementById('transaction-type').value = type;
            updateCategoryOptions();
            
            // Navigate to transactions section
            showSection('transactions');
            
            // Focus on amount field for quick entry
            setTimeout(() => {
                document.getElementById('transaction-amount').focus();
            }, 100);
        }

        // Layout Customization Functions
        function toggleLayoutCustomization() {
            const modal = document.getElementById('layout-modal');
            const isVisible = modal.classList.contains('show');
            
            if (isVisible) {
                modal.classList.remove('show');
            } else {
                modal.classList.add('show');
                populateLayoutItems();
            }
        }

        function populateLayoutItems() {
            const container = document.getElementById('layout-items');
            const layoutItems = [
                { id: 'quick-add', name: '⚡ Quick Add Buttons', description: 'Fast access to add transactions' },
                { id: 'summary-cards', name: '📊 Summary Cards', description: 'Income, expenses, savings overview' },
                { id: 'rule-section', name: '🎯 50/30/20 Rule', description: 'Budget rule progress tracking' },
                { id: 'charts-section', name: '📈 Charts & Analytics', description: 'Visual data representation' }
            ];
            
            container.innerHTML = dashboardLayout.map((itemId, index) => {
                const item = layoutItems.find(i => i.id === itemId);
                return `
                    <div class="layout-item" draggable="true" data-id="${itemId}" data-index="${index}">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-semibold">${item.name}</div>
                                <div class="text-sm text-gray-600 dark:text-gray-300">${item.description}</div>
                            </div>
                            <i class="fas fa-grip-vertical text-gray-400"></i>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Add drag and drop functionality
            initializeDragAndDrop();
        }

        function initializeDragAndDrop() {
            const items = document.querySelectorAll('.layout-item');
            const container = document.getElementById('layout-items');
            
            items.forEach(item => {
                item.addEventListener('dragstart', handleDragStart);
                item.addEventListener('dragend', handleDragEnd);
            });
            
            container.addEventListener('dragover', handleDragOver);
            container.addEventListener('drop', handleDrop);
        }

        let draggedElement = null;

        function handleDragStart(e) {
            draggedElement = this;
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        }

        function handleDragEnd(e) {
            this.classList.remove('dragging');
            draggedElement = null;
        }

        function handleDragOver(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const afterElement = getDragAfterElement(e.clientY);
            const container = document.getElementById('layout-items');
            
            if (afterElement == null) {
                container.appendChild(draggedElement);
            } else {
                container.insertBefore(draggedElement, afterElement);
            }
        }

        function handleDrop(e) {
            e.preventDefault();
            updateLayoutOrder();
        }

        function getDragAfterElement(y) {
            const draggableElements = [...document.querySelectorAll('.layout-item:not(.dragging)')];
            
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }

        function updateLayoutOrder() {
            const items = document.querySelectorAll('.layout-item');
            dashboardLayout = Array.from(items).map(item => item.dataset.id);
        }

        function saveLayoutOrder() {
            localStorage.setItem('budgetTracker_layout', JSON.stringify(dashboardLayout));
            applyDashboardLayout();
            toggleLayoutCustomization();
            showNotification('Dashboard layout saved!', 'success');
        }

        function resetLayoutOrder() {
            dashboardLayout = ['quick-add', 'summary-cards', 'rule-section', 'charts-section'];
            localStorage.removeItem('budgetTracker_layout');
            populateLayoutItems();
            applyDashboardLayout();
            showNotification('Layout reset to default!', 'success');
        }

        function applyDashboardLayout() {
            const dashboardSection = document.getElementById('dashboard-section');
            const welcomeSection = document.getElementById('welcome-section');
            const resetContainer = document.getElementById('reset-button-container');
            
            // Get all dashboard elements
            const elements = {
                'quick-add': document.getElementById('quick-add-section'),
                'summary-cards': document.getElementById('summary-cards'),
                'rule-section': document.getElementById('rule-section'),
                'charts-section': document.getElementById('charts-section')
            };
            
            // Reorder elements based on layout
            dashboardLayout.forEach(itemId => {
                const element = elements[itemId];
                if (element) {
                    dashboardSection.appendChild(element);
                }
            });
            
            // Ensure welcome section stays at top and reset button at bottom
            dashboardSection.insertBefore(welcomeSection, dashboardSection.firstChild);
            dashboardSection.appendChild(resetContainer);
        }

        function loadDashboardLayout() {
            const savedLayout = localStorage.getItem('budgetTracker_layout');
            if (savedLayout) {
                dashboardLayout = JSON.parse(savedLayout);
            }
        }

        // Utility Functions
        function updateCurrencyDisplay() {
            document.getElementById('currency-symbol').textContent = currentCurrency.symbol;
        }

        // Swipe Gestures
        let swipeData = {};

        function initializeSwipeGestures() {
            const transactionItems = document.querySelectorAll('.transaction-item');
            
            transactionItems.forEach(item => {
                const content = item.querySelector('.transaction-content');
                let startX = 0;
                let currentX = 0;
                let isDragging = false;
                
                // Touch events
                content.addEventListener('touchstart', handleTouchStart, { passive: true });
                content.addEventListener('touchmove', handleTouchMove, { passive: false });
                content.addEventListener('touchend', handleTouchEnd, { passive: true });
                
                // Mouse events for desktop testing
                content.addEventListener('mousedown', handleMouseStart);
                content.addEventListener('mousemove', handleMouseMove);
                content.addEventListener('mouseup', handleMouseEnd);
                content.addEventListener('mouseleave', handleMouseEnd);
                
                function handleTouchStart(e) {
                    startX = e.touches[0].clientX;
                    isDragging = true;
                    content.style.transition = 'none';
                }
                
                function handleMouseStart(e) {
                    startX = e.clientX;
                    isDragging = true;
                    content.style.transition = 'none';
                    e.preventDefault();
                }
                
                function handleTouchMove(e) {
                    if (!isDragging) return;
                    
                    currentX = e.touches[0].clientX;
                    const deltaX = currentX - startX;
                    
                    // Limit swipe distance
                    const maxSwipe = 80;
                    const clampedDelta = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
                    
                    content.style.transform = `translateX(${clampedDelta}px)`;
                    
                    // Show appropriate action
                    if (Math.abs(clampedDelta) > 20) {
                        const action = clampedDelta > 0 ? 'edit' : 'delete';
                        showSwipeFeedback(action);
                    }
                    
                    e.preventDefault();
                }
                
                function handleMouseMove(e) {
                    if (!isDragging) return;
                    
                    currentX = e.clientX;
                    const deltaX = currentX - startX;
                    
                    // Limit swipe distance
                    const maxSwipe = 80;
                    const clampedDelta = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
                    
                    content.style.transform = `translateX(${clampedDelta}px)`;
                    
                    // Show appropriate action
                    if (Math.abs(clampedDelta) > 20) {
                        const action = clampedDelta > 0 ? 'edit' : 'delete';
                        showSwipeFeedback(action);
                    }
                }
                
                function handleTouchEnd(e) {
                    if (!isDragging) return;
                    
                    const deltaX = currentX - startX;
                    const threshold = 50;
                    
                    content.style.transition = 'transform 0.3s ease';
                    content.style.transform = 'translateX(0)';
                    
                    if (Math.abs(deltaX) > threshold) {
                        const transactionId = parseInt(item.dataset.transactionId);
                        
                        if (deltaX > 0) {
                            // Swipe right - edit
                            setTimeout(() => editTransaction(transactionId), 300);
                        } else {
                            // Swipe left - delete
                            setTimeout(() => deleteTransaction(transactionId), 300);
                        }
                    }
                    
                    isDragging = false;
                    hideSwipeFeedback();
                }
                
                function handleMouseEnd(e) {
                    if (!isDragging) return;
                    
                    const deltaX = currentX - startX;
                    const threshold = 50;
                    
                    content.style.transition = 'transform 0.3s ease';
                    content.style.transform = 'translateX(0)';
                    
                    if (Math.abs(deltaX) > threshold) {
                        const transactionId = parseInt(item.dataset.transactionId);
                        
                        if (deltaX > 0) {
                            // Swipe right - edit
                            setTimeout(() => editTransaction(transactionId), 300);
                        } else {
                            // Swipe left - delete
                            setTimeout(() => deleteTransaction(transactionId), 300);
                        }
                    }
                    
                    isDragging = false;
                    hideSwipeFeedback();
                }
            });
        }

        function showSwipeFeedback(action) {
            const feedback = document.getElementById('swipe-feedback');
            const text = action === 'edit' ? '✏️ Edit Transaction' : '🗑️ Delete Transaction';
            feedback.textContent = text;
            feedback.classList.add('show');
        }

        function hideSwipeFeedback() {
            const feedback = document.getElementById('swipe-feedback');
            feedback.classList.remove('show');
        }

        // Pull to Refresh
        function initializePullToRefresh() {
            const mainContent = document.getElementById('main-content');
            const refreshIndicator = document.getElementById('refresh-indicator');
            let startY = 0;
            let currentY = 0;
            let isPulling = false;
            let isRefreshing = false;
            
            mainContent.addEventListener('touchstart', handlePullStart, { passive: true });
            mainContent.addEventListener('touchmove', handlePullMove, { passive: false });
            mainContent.addEventListener('touchend', handlePullEnd, { passive: true });
            
            function handlePullStart(e) {
                if (mainContent.scrollTop === 0) {
                    startY = e.touches[0].clientY;
                    isPulling = true;
                }
            }
            
            function handlePullMove(e) {
                if (!isPulling || isRefreshing) return;
                
                currentY = e.touches[0].clientY;
                const deltaY = currentY - startY;
                
                if (deltaY > 0 && mainContent.scrollTop === 0) {
                    const pullDistance = Math.min(deltaY * 0.5, 80);
                    
                    if (pullDistance > 20) {
                        refreshIndicator.classList.add('visible');
                        refreshIndicator.style.top = `${pullDistance - 40}px`;
                    }
                    
                    e.preventDefault();
                }
            }
            
            function handlePullEnd(e) {
                if (!isPulling) return;
                
                const deltaY = currentY - startY;
                
                if (deltaY > 60 && !isRefreshing) {
                    triggerRefresh();
                } else {
                    refreshIndicator.classList.remove('visible');
                    refreshIndicator.style.top = '-60px';
                }
                
                isPulling = false;
            }
            
            function triggerRefresh() {
                isRefreshing = true;
                refreshIndicator.classList.add('loading');
                refreshIndicator.style.top = '20px';
                
                // Simulate refresh delay
                setTimeout(() => {
                    // Refresh data
                    updateDashboard();
                    renderTransactionsList();
                    renderGoals();
                    renderBudgets();
                    updateInsightsSection();
                    
                    // Hide refresh indicator
                    refreshIndicator.classList.remove('visible', 'loading');
                    refreshIndicator.style.top = '-60px';
                    isRefreshing = false;
                    
                    showNotification('Data refreshed successfully!', 'success');
                }, 1000);
            }
        }

        // Floating Add Button
        function showFloatingAddMenu() {
            showSection('transactions');
            document.getElementById('transaction-amount').focus();
        }

        // Update floating button visibility based on current section
        function updateFloatingButtonVisibility() {
            const floatingBtn = document.getElementById('floating-add-btn');
            if (currentSection === 'transactions') {
                floatingBtn.style.display = 'none';
            } else {
                floatingBtn.style.display = 'flex';
            }
        }

        // Notification System
        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.innerHTML = `
                <div class="flex items-center justify-between">
                    <span>${message}</span>
                    <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 5000);
        }