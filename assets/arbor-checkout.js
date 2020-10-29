(function() {
  
  var renderPO = function(gatewayId) {
    let $fieldsArea = ac$("#payment-gateway-subfields-" + gatewayId);
    if(!$fieldsArea.hasClass("fields-applied")) {

      let $fieldsContainer = ac$("<ul/>").addClass("custom-fields");

      let $thisField = ac$("<li/>").data('field','po-number');
      let $thisLabel = ac$("<label/>").attr('for','po-number').html("PO Number");
      let $thisInput = ac$("<input/>").attr('type','text').attr('id','po-number').attr("name","checkout[attributes][PO Number]").attr("maxlength",22).val(ac.poNumber);
      let $thisError = ac$("<div/>").addClass('custom-fields-error po-error').html("Please enter a valid PO Number to complete your order.");
      $thisField.append($thisLabel).append($thisInput).append($thisError);
      $fieldsContainer.append($thisField);

      $fieldsArea.append($fieldsContainer);   
      $fieldsArea.addClass("fields-applied");
    }
  };
  
  var renderTaxExemption = function(teNumber) {
        
    if(ac$(".section--tax-exemption").length > 0) return true;
    
    //put in content
    let template = '<div class="section section--tax-exemption">';
    template += '<div class="section__header">';
    template += '<div class="checkbox-wrapper">';
    template += '<div class="checkbox__input">';
	template += '<input id="tax-exemption-toggler" class="input-checkbox" type="checkbox" value="1"/>';
    template += '</div>';
    template += '<label class="checkbox__label" for="tax-exemption-toggler">';
    template += 'Do you have a tax exemption?';
    template += '</label>';
    template += '</div>';
    template += '</div>';
    template += '<div class="section__header tax-exemption-toggle" style="display:none;">';
    template += '<h2 class="section__title" id="tax-exempt-header" tabindex="-1">Michigan Only</h2>';
    template += '<p>If you have an exemption, please enter your Tax Exemption ID below:</p>';
    template += '</div>';
    template += '<div class="section__content tax-exemption-toggle" style="display:none;">';
    template += '<input disabled id="tax-exemption-input" class="field__input" type="text" name="checkout[attributes][Tax Exemption Number]" placeholder="Tax Exemption ID" value="{{id}}">';
    template += '</div>';
    template += '</div>';
    template = template.replace("{{id}}", teNumber);
    ac$(".step__sections").append(template);
    
    //attach form submission handler
    ac$(".main__content form").on("submit", function() {
      
      //already handled?
      if(ac.teApplied) return true;
      
      //field disabled?
      if(ac$("#tax-exemption-input").prop("disabled")) return true;
      
      //no value in field?
      let teNumber = ac$.trim(ac$("#tax-exemption-input").val());
      if(teNumber == "") return true;
      
      //assemble props to pass to app
      let props = {"email": ac.email, "tid": teNumber};      
      
      //pass to app to upsert customer with tax exemption
      ac$.ajax({
        type: "POST",
        url: "https://gs-arbor.herokuapp.com/customers/tax",
        dataType: "json",
        data: props,
        success: function(resp) {
          ac.teApplied = true;
          ac$(".main__content form").submit();
        },
        error: function() {
          ac.teApplied = true;
          ac$(".main__content form").submit();
        }
      });
      
      
      return false;
    });
    
    //attach toggler
    ac$("#tax-exemption-toggler").on("click", function() {
      if(ac$(this).is(":checked")) {
        ac$(".tax-exemption-toggle").show();
        ac$("#tax-exemption-input").prop("disabled", false);
      }
      else {
        ac$(".tax-exemption-toggle").hide();
        ac$("#tax-exemption-input").prop("disabled", true);
      }
    });
    
    //we already have a value? check the box
    if(teNumber != "")
      ac$("#tax-exemption-toggler").click();
  };
  
  var renderAttributes = function() {
    for(var attr of ac.attributes) {
      let $thisAttr = ac$("<input/>").attr('type','hidden').attr("name","checkout[attributes][" + attr.name + "]").val(attr.value);
      ac$(".main__content form").prepend($thisAttr);
    }
  };
  
  if(ac.marketing && ac$("#checkout_buyer_accepts_marketing").length > 0) {
  	let marketingCheck = document.getElementById("checkout_buyer_accepts_marketing");
    marketingCheck.setAttribute('checked', 'checked');
  }
  
  if(ac.email != "" && ac$(".section--shipping-method").length > 0) {
  	renderTaxExemption(ac.teNumber);
  }
  
  //output hidden fields with current attributes so we make sure to save them
  renderAttributes();
  
  ac$("body").on("change", "input[name='checkout[payment_gateway]']:visible", function() {
    let gatewayId = ac$(this).val();
    window.sessionStorage.setItem("gateway-selection", gatewayId);
    let gatewayGroup = ac$(this).closest("[data-gateway-group]").data('gatewayGroup');
    if(gatewayGroup == "manual") {
      renderPO(gatewayId);
    }
  });
  if(window.sessionStorage.getItem("gateway-selection") && ac$("#checkout_payment_gateway_" + window.sessionStorage.getItem("gateway-selection")).length > 0) {
    ac$("#checkout_payment_gateway_" + window.sessionStorage.getItem("gateway-selection")).click();
    renderPO(window.sessionStorage.getItem("gateway-selection"));
  }
  
  ac$("button[data-trekkie-id=complete_order_button]:visible").click(function(e) {
    ac$(".custom-fields-error.po-error").hide();
    if(ac$("#po-number").is(":visible")) {
      let poNumber = ac$.trim(ac$("#po-number").val());
      if(poNumber == "" || poNumber.length > 22) {
        ac$(".custom-fields-error.po-error").show();
        return false;        
      }
    }
    return true;
  });
  
  ac$('label[for="checkout_buyer_accepts_marketing"]').text('Sign Up for the CoolStuff Newsletter');
})();