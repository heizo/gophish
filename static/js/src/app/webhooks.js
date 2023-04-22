let webhooks = [];

const dismiss = () => {
    $("#name").val("");
    $("#url").val("");
    $("#secret").val("");
    $("#is_active").prop("checked", false);
    $("#flashes").empty();
};

const saveWebhook = (id) => {
    let wh = {
        name: $("#name").val(),
        url: $("#url").val(),
        secret: $("#secret").val(),
        is_active: $("#is_active").is(":checked"),
    };
    if (id != -1) {
        wh.id = parseInt(id);
        api.webhookId.put(wh)
            .done(function(data) {
                dismiss();
                load();
                $("#modal").modal("hide");
                successFlash(`Webhook "${escapeHtml(wh.name)}" has been updated successfully!`);
            })
            .fail(function(data) {
                modalError(data.responseJSON.message)
            })
    } else {
        api.webhooks.post(wh)
            .done(function(data) {
                load();
                dismiss();
                $("#modal").modal("hide");
                successFlash(`Webhook "${escapeHtml(wh.name)}" has been created successfully!`);
            })
            .fail(function(data) {
                modalError(data.responseJSON.message)
            })
    }
};

const load = () => {
    $("#webhookTable").hide();
    $("#loading").show();
    api.webhooks.get()
        .done((whs) => {
            webhooks = whs;
            $("#loading").hide()
            $("#webhookTable").show()
            let webhookTable = $("#webhookTable").DataTable({
                destroy: true,
                columnDefs: [{
                    orderable: false,
                    targets: "no-sort"
                }]
            });
            webhookTable.clear();
            $.each(webhooks, (i, webhook) => {
                webhookTable.row.add([
                    escapeHtml(webhook.name),
                    escapeHtml(webhook.url),
                    escapeHtml(webhook.is_active),
                    `
                      <div class="pull-right">
                        <button class="btn btn-primary ping_button" data-webhook-id="${webhook.id}">
                          Ping
                        </button>
                        <button class="btn btn-primary edit_button" data-toggle="modal" data-backdrop="static" data-target="#modal" data-webhook-id="${webhook.id}">
                          <i class="fa fa-pencil"></i>
                        </button>
                        <button class="btn btn-danger delete_button" data-webhook-id="${webhook.id}">
                          <i class="fa fa-trash-o"></i>
                        </button>
                      </div>
                    `
                ]).draw()
            })
        })
        .fail(() => {
            errorFlash("Error fetching webhooks")
        })
};

const editWebhook = (id) => {
    $("#modalSubmit").off("click").on("click", () => {
        saveWebhook(id);
    });
    if (id !== -1) {
        $("#webhookModalLabel").text("Edit Webhook")
        api.webhookId.get(id)
          .done(function(wh) {
              $("#name").val(wh.name);
              $("#url").val(wh.url);
              $("#secret").val(wh.secret);
              $("#is_active").prop("checked", wh.is_active);
          })
          .fail(function () {
              errorFlash("Error fetching webhook")
          });
    } else {
        $("#webhookModalLabel").text("New Webhook")
    }
};

const deleteWebhook = (id) => {
    var wh = webhooks.find(x => x.id == id);
    if (!wh) {
        return;
    }
    Swal.fire({
        title: "Are you sure?",
        text: `This will delete the webhook '${escapeHtml(wh.name)}'`,
        type: "warning",
        animation: false,
        showCancelButton: true,
        confirmButtonText: "Delete",
        confirmButtonColor: "#428bca",
        reverseButtons: true,
        allowOutsideClick: false,
        preConfirm: function () {
            return new Promise((resolve, reject) => {
                api.webhookId.delete(id)
                    .done((msg) => {
                        resolve()
                    })
                    .fail((data) => {
                        reject(data.responseJSON.message)
                    })
            })
            .catch(error => {
                Swal.showValidationMessage(error)
              })
        }
    }).then(function(result) {
        if (result.value) {
            Swal.fire(
                "Webhook Deleted!",
                `The webhook has been deleted!`,
                "success"
            );
        }
        $("button:contains('OK')").on("click", function() {
            location.reload();
        })
    })
};

const pingUrl = (btn, whId) => {
    dismiss();
    btn.disabled = true;
    api.webhookId.ping(whId)
        .done(function(wh) {
            btn.disabled = false;
            successFlash(`Ping of "${escapeHtml(wh.name)}" webhook succeeded.`);
        })
        .fail(function(data) {
            btn.disabled = false;
            var wh = webhooks.find(x => x.id == whId);
            if (!wh) {
                return
            }
            errorFlash(`Ping of "${escapeHtml(wh.name)}" webhook failed: "${escapeHtml(data.responseJSON.message)}"`)
        });
};

$(function() {
    load();
    $("#modal").on("hide.bs.modal", function() {
        dismiss();
    });
    $("#new_button").on("click", function() {
        editWebhook(-1);
    });
    $("#webhookTable").on("click", ".edit_button", function(e) {
        editWebhook($(this).attr("data-webhook-id"));
    });
    $("#webhookTable").on("click", ".delete_button", function(e) {
        deleteWebhook($(this).attr("data-webhook-id"));
    });
    $("#webhookTable").on("click", ".ping_button", function(e) {
        pingUrl(e.currentTarget, e.currentTarget.dataset.webhookId);
    });
});
