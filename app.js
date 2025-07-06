$(function () {
    const mondayKey = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjQ4NTUyNTY4MiwiYWFpIjoxMSwidWlkIjo3MzMyOTAyMiwiaWFkIjoiMjAyNS0wMy0xNFQwNDoxMDo1Ni4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MjIyNTg1ODUsInJnbiI6ImV1YzEifQ.-Ap3N_t294IyUg8ZEqEACYvylZjQhOCyYWmHMXPVT1I'; // Replace with your key securely
    const boardId = 1973910040;        // Your actual board ID
    const ticketColumnId = 'pulse_id_mkrcg1h'; // Replace with your actual column ID if different

    $('#form-request').submit(function (e) {
        e.preventDefault();

        const ticketNumber = $('#ticketNumber').val().trim();
        if (!ticketNumber) {
            showAlert('Please enter a ticket number.', 'danger');
            return;
        }

        setLoadingState(true);

        const query = `
            query GetBoardItems {
                boards(ids: ${boardId}) {
                    items_page(limit: 500) {
                        items {
                            id
                            name
                            column_values {
                                id
                                text
                            }
                        }
                    }
                }
            }
        `;

        $.ajax({
            url: 'https://api.monday.com/v2',
            method: 'POST',
            contentType: 'application/json',
            headers: {
                'Authorization': mondayKey
            },
            data: JSON.stringify({ query }),
            success: function (response) {
                const items = response.data.boards[0].items_page.items;
                let foundItem = null;

                items.forEach(item => {
                    item.column_values.forEach(col => {
                        if (col.id === ticketColumnId && col.text && col.text.trim() === ticketNumber) {
                            foundItem = item;
                        }
                    });
                });

                if (foundItem) {
                    let details = `
                        <div class="mt-2 small">
                            <strong>Ticket Found!</strong><br>
                            <strong>Item ID:</strong> ${foundItem.id}<br>
                            <strong>Name:</strong> ${foundItem.name}<br>
                            <strong>Columns:</strong><br>
                            <ul>
                    `;

                    foundItem.column_values.forEach(col => {
                        details += `<li><strong>${col.id}:</strong> ${col.text}</li>`;
                    });

                    details += '</ul></div>';

                    showAlert('Ticket found on Monday.com board.', 'success', details);

                    // Change status

                    const desiredStatusIndex = 1; // 0, 1, 2 etc. based on your status labels

                    // Build the mutation with clear formatting
                    const changeStatusQuery = `
                        mutation ChangeItemStatus {
                            change_column_value(
                                board_id: ${boardId},
                                item_id: ${foundItem.id},
                                column_id: "color_mkrfsvz3",
                                value: ${JSON.stringify(JSON.stringify({ index: desiredStatusIndex }))}
                            ) {
                                id
                            }
                        }
                    `;

                    $.ajax({
                        url: 'https://api.monday.com/v2',
                        method: 'POST',
                        contentType: 'application/json',
                        headers: {
                            'Authorization': mondayKey
                        },
                        data: JSON.stringify({ query: changeStatusQuery }),
                        success: function (updateResponse) {
                            console.log("Status updated:", updateResponse);
                            showAlert('Ticket found and status updated to <strong>Resolved</strong>.', 'success', details);
                        },
                        error: function (err) {
                            console.error('Error updating status:', err.responseText);
                            showAlert('Ticket found, but failed to update status.', 'warning', details);
                        }
                    });
                } else {
                    showAlert('Ticket number not found on Monday.com.', 'danger');
                }
            },
            error: function (xhr, status, error) {
                console.error('Monday API Error:', xhr.responseText);
                showAlert('An error occurred while contacting Monday.com.', 'danger');
            },
            complete: function () {
                setLoadingState(false);
            }
        });
    });

    function showAlert(message, type, details = '') {
        const alertClasses = {
            'success': 'alert-success',
            'danger': 'alert-danger',
            'warning': 'alert-warning',
            'info': 'alert-info'
        };

        const alertHtml = `
            <div class="alert ${alertClasses[type] || 'alert-info'} alert-dismissible fade show" role="alert">
                ${message}
                ${details}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;

        $('#alertContainer').html(alertHtml);
    }

    function setLoadingState(loading) {
        $('#submitBtn').prop('disabled', loading);
        $('#ticketNumber').prop('disabled', loading);
    }
});
