function updateUserAddressList(){
	$.ajax({
        type: 'POST',
        url: 'getUserAddresses',
        dataType: 'json',
        success: function(data){
            $('select[name="address"]').html("<option value>Select an address</option>");
            for (var i = 0; i < data.address.length; i++) {
                if(i == data.defaultAddress)
                    $('select[name="address"]').append("<option xaddress='"+data.address[i].address+"' xpostalcode='"+data.address[i].postalCode+"' selected value='"+i+"'>"+data.address[i].address+", "+data.address[i].postalCode+"</option>");
                else
                    $('select[name="address"]').append("<option xaddress='"+data.address[i].address+"' xpostalcode='"+data.address[i].postalCode+"' value='"+i+"'>"+data.address[i].address+", "+data.address[i].postalCode+"</option>");
            };
        }
    });
}

$(function() {
	updateUserAddressList();

    $('select[name="address"]').change(function(){
        $.ajax({
                type: 'POST',
                data: {address:$('select[name=address]').val()},
                url: 'changeDefaultAddress',
                dataType: 'text',
                success: function(data){
                    updateUserAddressList();
                },
            }); 
    });

    $( "#addAddress" ).click(function() {
        var address=prompt("Please enter the address","");
        var postalCode=prompt("Please enter the postal code","");

        GMaps.geocode({
                  address: address + ", "+postalCode,
                  callback: function(results, status) {
                    if (status != 'OK' && 
                        results[0].address_components[7].long_name.replace(/\s/g, '') == postalCode.replace(/\s/g, '')) {
                        alert("The provided address/postal code does not exist");
                        return 0;
                    }else{
                        if(address != "" && postalCode != "") {
                            $.ajax({
                                type: 'POST',
                                data: {address:address, postalcode: postalCode},
                                url: 'addAddressToCurrentUser',
                                dataType: 'text',
                                success: function(data){
                                    updateUserAddressList();
                                },
                            }); 
                        }
                        else
                            alert("The address and the postal code are required");
                    }
                }
            });
    });

    $( "#send" ).click(function() {
        var outJson = {
            address: JSON.stringify({address:$('select[name=address] option:selected').attr("xaddress"), postalCode:$('select[name=address] option:selected').attr("xpostalCode")}),
            date: $('input[name=deliveryDate]').val(),
            order: jQuery.parseJSON( $('input[name="order"]').val()),
            restaurantId: $('input[name="restaurantId"]').val()
        };

         $.ajax({
            type: 'POST',
            data: {order:outJson},
            url: 'sendOrder',
            dataType: 'text',
            success: function(data){
                window.location.replace("orderSendConfirmation");
            },
        }); 
    });
});