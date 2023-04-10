// All Javascript written by Jeffrey B. Madden 2019.
(function() {
var Shop = function( element ) {
   this.element = document.getElementById(element) ;
   this.init() ;
   } ;

Shop.prototype = {
   // Properties
   init : function() {
      this.cartPrefix = "winery-" ;
      this.cartName = this.cartPrefix + "cart" ;
      this.shippingRates = this.cartPrefix + "shipping-rates" ;
      this.total = this.cartPrefix + "total" ;
      this.storage = sessionStorage ;

      this.formCart = document.getElementById("shopping-cart") ;
      this.formAddToCart = document.getElementsByClassName("add-to-cart") ;
      this.checkoutCart = document.getElementById("checkout-cart") ;
      this.checkoutOrderForm = document.getElementById("checkout-order-form") ;
      this.shipping = document.getElementById("sshipping") ;
      this.subTotal = document.getElementById("stotal") ;
      this.shoppingCartActions = document.getElementById("shopping-cart-actions") ;
      this.updateCartBtn = document.getElementById("update-cart") ;
      this.emptyCartBtn = document.getElementById("empty-cart") ;
      this.userDetails = document.getElementById("user-details-content") ;
      this.paypalForm = document.getElementById("paypal-form") ;

      this.currency = "&euro;" ;
      this.currencyString = "€" ;
      this.paypalCurrency = "EUR" ;
      this.paypalBusinessEmail = "yourbusiness@email.com" ;
      this.paypalURL = "https://www.sandbox.paypal.com/cgi-bin/webscr" ;

      this.requiredFields = {
         expression : { value : /^([\w-\.]+)@((?:[\w]+\.)+)([a-z]){2,4}$/ } ,
         str : { value : "" }
         } ;

      this.createCart() ;
      this.handleAddToCartForm() ;
      this.handleCheckoutOrderForm() ;
      this.emptyCart() ;
      this.updateCart() ;
      this.displayCart() ;
      this.displayUserDetails() ;
      this.populatePaypalForm() ;
      } ,

   // Public functions
   createCart : function() {
      var self = this ;

      if ( self.storage.getItem(self.cartName) == null )
         {
         var cart = {} ;
         cart.items = [] ;

         self.storage.setItem(self.cartName , self._toJSONString(cart)) ;
         self.storage.setItem(self.shippingRates , "0") ;
         self.storage.setItem(self.total , "0") ;
         }
      } ,

   handleAddToCartForm : function() {
      var self = this ;

      var sform = Array.from(self.formAddToCart) ; // forEach only accepts arrays, not array-like objects
      sform.forEach(function( form ) {
         var product = form.parentElement ;
         var name = product.getElementsByClassName("product-name")[0] ;
         var price = product.getElementsByClassName("product-price")[0] ;
         name = name.innerHTML ;
         price = self._convertString(price.innerHTML) ;

         form.addEventListener("submit", function() {
            var qty = form.getElementsByClassName("qty")[0] ;
            qty = self._convertString(qty.value) ;
            var subTotal = qty * price ;
            var total = self._convertString(self.storage.getItem(self.total)) ;
            var sTotal = total + subTotal ;
            self.storage.setItem(self.total , sTotal) ;
            self._addToCart({ product : name , price : price , qty : qty }) ;
            var shipping = self._convertString(self.storage.getItem(self.shippingRates)) ;
            var shippingRates = self._calculateShipping(qty) ;
            var totalShipping = shipping + shippingRates ;
            self.storage.setItem(self.shippingRates , totalShipping) ;
            } , true) ;
         } ) ;
      } ,

   displayCart : function() {
      var self = this ;

      if ( self.formCart || self.checkoutCart )
         {
         var cart = self._toJSONObject(self.storage.getItem(self.cartName)) ;
         var items = cart.items ;
         if ( self.formCart ) { var tableCart = self.formCart ; }
         else { var tableCart = self.checkoutCart ; }
         var tableCartBody = tableCart.getElementsByTagName("tbody")[0] ;

         var x ;
         var len = items.length ;
         for ( x = 0 ; x < len ; x++ )
            {
            var item = items[x] ;
            var price = self.currency + " " + item.price ;
            var html = "<tr>" ;
               html += "<td class='pname'>" + item.product + "</td>" ;
               html += "<td class='pqty'>" + item.qty + "</td>" ;
               html += "<td class='pprice'>" + item.price + "</td>" ;
               html += "</tr>" ;
            tableCartBody.innerHTML += html ;
            }

         if ( self.formCart )
            {
            var total = self.storage.getItem(self.total) ;
            this.subTotal.innerHTML = self.currency + " " + total ;
            }
         else if ( self.checkoutCart )
            {
            var total = self.storage.getItem(self.total) ;
            var shipping = self.storage.getItem(self.shippingRates) ;
            var subTotal = self._convertString(total) + self._convertString(shipping) ;
            this.subTotal.innerHTML = self.currency + " " + self._convertString(subTotal) ;
            this.shipping.innerHTML = self.currency + " " + shipping ;
            }
         }
      } ,

   updateCart : function() {
      var self = this ;

      if ( self.updateCartBtn )
         {
         self.updateCartBtn.addEventListener("click", function() {
            var formCart = self.formCart ;
            var tbody = formCart.getElementsByTagName("tbody")[0] ;
            var rows = tbody.getElementsByTagName("tr") ;
            var cart = self.storage.getItem(self.cartName) ;
            var shippingRates = self.storage.getItem(self.shippingRates) ;
            var total = self.storage.getItem(self.total) ;

            var updatedTotal = 0 ;
            var totalQty = 0 ;
            var updatedCart = {} ;
            updatedCart.items = [] ;

            rows = Array.from(rows) ;
            rows.forEach(function( row ) {
               var pname = row.getElementsByClassName("pname")[0].innerHTML ;
               var pqty = row.getElementsByClassName("pqty")[0].innerHTML ;
               var pprice = row.getElementsByClassName("pprice")[0].innerHTML ;
               pqty = self._convertString(pqty) ;
               pprice = self._convertString(self._extractPrice(pprice)) ;

               var cartObj = { product : pname , price : pprice , qty : pqty } ;
               updatedCart.items.push(cartObj) ;

               var subTotal = pqty * pprice ;
               updatedTotal += subTotal ;
               totalQty += pqty ;
               } , true) ;

            self.storage.setItem(self.total , self._convertNumber(updatedTotal)) ;
            self.storage.setItem(self.shippingRates , self._convertNumber(self._calculateShipping(totalQty))) ;
            self.storage.setItem(self.cartName , self._toJSONString(updatedCart)) ;
            } , true) ;
         }
      } ,

   emptyCart : function() {
      var self = this ;

      if ( self.emptyCartBtn )
         {
         self.emptyCartBtn.addEventListener("click", function() { self._emptyCart() ; } , true) ;
         }
      } ,

   handleCheckoutOrderForm : function() {
      var self = this ;

      if ( self.checkoutOrderForm )
         {
         var sameAsBilling = document.getElementById("same-as-billing") ;
         var fieldset = document.getElementById("fieldset-shipping") ;

         sameAsBilling.addEventListener("change", function() {
            self._slide(fieldset , sameAsBilling.checked) ;
            } , true) ;

         this.checkoutOrderForm.addEventListener("submit", function() {
            var valid = self._validateForm(this) ;
            if ( !valid ) { return valid ; }
            else { self._saveFormData(this) ; }
            } , true) ;
         }
      } ,

   displayUserDetails : function() {
      var self = this ;

      if ( self.userDetails )
         {
         var name = self.storage.getItem("billing-name") ;
         var email = self.storage.getItem("billing-email") ;
         var city = self.storage.getItem("billing-city") ;
         var address = self.storage.getItem("billing-address") ;
         var zip = self.storage.getItem("billing-zip") ;
         var country = self.storage.getItem("billing-country") ;

         if ( this.storage.getItem("shipping-name") == null )
            {
            var html = "<div class='detail'>" ;
            html += "<h2>Billing and Shipping</h2>" ;
            html += "<ul>" ;
            html += "<li>" + name + "</li>" ;
            html += "<li>" + email + "</li>" ;
            html += "<li>" + city + "</li>" ;
            html += "<li>" + address + "</li>" ;
            html += "<li>" + zip + "</li>" ;
            html += "<li>" + country + "</li>" ;
            html += "<ul></div>" ;
            }
         else
            {
            var sName = self.storage.getItem("shipping-name") ;
            var sEmail = self.storage.getItem("shipping-email") ;
            var sCity = self.storage.getItem("shipping-city") ;
            var sAddress = self.storage.getItem("shipping-address") ;
            var sZip = self.storage.getItem("shipping-zip") ;
            var sCountry = self.storage.getItem("shipping-country") ;

            var html = "<div class='detail'>" ;
            html += "<h2>Billing</h2>" ;
            html += "<ul>" ;
            html += "<li>" + name + "</li>" ;
            html += "<li>" + email + "</li>" ;
            html += "<li>" + city + "</li>" ;
            html += "<li>" + address + "</li>" ;
            html += "<li>" + zip + "</li>" ;
            html += "<li>" + country + "</li>" ;
            html += "<ul></div>" ;

            html += "<div class='detail right'>" ;
            html += "<h2>Shipping</h2>" ;
            html += "<ul>" ;
            html += "<li>" + sName + "</li>" ;
            html += "<li>" + sEmail + "</li>" ;
            html += "<li>" + sCity + "</li>" ;
            html += "<li>" + sAddress + "</li>" ;
            html += "<li>" + sZip + "</li>" ;
            html += "<li>" + sCountry + "</li>" ;
            html += "<ul></div>" ;
            }

         self.userDetails.innerHTML = html ;
         }
      } ,

   populatePaypalForm : function() {
      var self = this ;

      if ( self.paypalForm )
         {
         var form = self.paypalForm ;
         var cart = self._toJSONObject(self.storage.getItem(self.cartName)) ;
         var shipping = self.storage.getItem(self.shippingRates) ;
         var numShipping = self._convertString(shipping) ;
         var cartItems = cart.items ;
         var singShipping = Math.floor(numShipping / cartItems.length) ;

         form.getAttributeNode("action").value = self.paypalURL ;
         var business = document.getElementsByName("business")[0] ;
         business.value = self.paypalBusinessEmail ;
         var currencyCode = document.getElementsByName("currency_code")[0] ;
         currencyCode.value = self.paypalCurrency ;

         var x ;
         var len = cartItems.length ;
         for ( x = 0 ; x < len ; x++ )
            {
            var cartItem = cartItems[x] ;
            var n = x + 1 ;
            var name = cartItem.product ;
            var price = cartItem.price ;
            var qty = cartItem.qty ;

            var paypalBtn = document.getElementById("paypal-btn") ;
            var div1 = document.createElement("div") ;
               div1.innerHTML = "<input type ='hidden' name='quantity_" + n + "' value='" + qty + "'  />" ;
               form.insertBefore(div1 , paypalBtn) ;
            var div2 = document.createElement("div") ;
               div2.innerHTML = "<input type ='hidden' name='item_name_" + n + "' value='" + name + "'  />" ;
               form.insertBefore(div2 , paypalBtn) ;
            var div3 = document.createElement("div") ;
               div3.innerHTML = "<input type ='hidden' name='item_number_" + n + "' value='SKU " + name + "'  />" ;
               form.insertBefore(div3 , paypalBtn) ;
            var div4 = document.createElement("div") ;
               div4.innerHTML = "<input type ='hidden' name='amount_" + n + "' value='" + self._formatNumber(price , 2) + "'  />" ;
               form.insertBefore(div4 , paypalBtn) ;
            var div5 = document.createElement("div") ;
               div5.innerHTML = "<input type ='hidden' name='shipping_" + n + "' value='" + self._formatNumber(singShipping , 2) + "'  />" ;
               form.insertBefore(div5 , paypalBtn) ;
            }
         }
      } ,

   // Private functions
   _slide : function( th , checked ) {
      if ( checked ) { th.style.display = "none" ; }
      else { th.style.display = "block" ; }
      } ,

   _emptyCart : function() {
      this.storage.clear() ;
      } ,

   _formatNumber : function( num , places ) {
      var n = num.toFixed(places) ;
      return n ;
      } ,

   _extractPrice : function( element ) {
      var self = this ;
      var text = element.innerHTML() ;
      var price = text.replace(self.currencyString , "") ;
      price = price.replace(" " , "") ;
      price = price.trim() ;
      return price ;
      } ,

   _convertString : function( numStr ) {
      var num ;
      if ( /^[-+]?[0-9]+.[0-9]+$/.test(numStr) ) { num = parseFloat(numStr) ; }
      else if ( /^d+$/.test(numStr) ) { num = parseInt(numStr) ; }
      else { num = Number(numStr) ; }

      if ( !isNaN(num) ) { return num ; }
      else { console.log(num + " cannot be converted into a number.") ; return false ; }
      } ,

   _convertNumber : function( n ) {
      var str = n.toString() ;
      return str ;
      } ,

   _toJSONObject : function( str ) {
      var obj = JSON.parse(str) ;
      return obj ;
      } ,

   _toJSONString : function( obj ) {
      var str = JSON.stringify(obj) ;
      return str ;
      } ,

   _addToCart : function( values ) {
      var self = this ;
      var cart = self.storage.getItem(self.cartName) ;
      var cartObject = self._toJSONObject(cart) ;
      var items = cartObject.items ;
      items.push(values) ;
      self.storage.setItem(self.cartName , self._toJSONString(cartObject)) ;
      } ,

   _calculateShipping : function( qty ) {
      var shipping = 0 ;
      if ( qty >= 6 ) { shipping = 10 ; }
      if ( (qty >= 12) && (qty <= 30) ) { shipping = 20 ; }
      if ( (qty >= 30) && (qty <= 60) ) { shipping = 30 ; }
      if ( qty > 60 ) { shipping = 0 ; }
      return shipping ;
      } ,

   _validateForm : function( form ) {
      var self = this ;
      var fields = self.requiredFields ;
      var visibleSet = form.getElementsByTagName("fieldset") ;
      var valid = true ;

      visibleSet = Array.from(visibleSet) ;
      visibleSet.forEach(function( fieldset ) {
         var inputs = fieldset.getElementsByTagName("input") ;

         inputs = Array.from(inputs) ;
         inputs.forEach(function( input ) {
            var type = input.getAttribute("data-type") ;
            var msg = input.getAttribute("data-message") ;

            if ( type == "string" )
               {
               if ( input.value == fields.str.value )
                  {
                  var error_msg = document.createElement("span") ;
                  var error_msg_class = document.createAttribute("class") ;
                  error_msg_class.value = "message" ;
                  error_msg.setAttributeNode(error_msg_class) ;
                  var error_msg_txt = document.createTextNode(msg) ;
                  error_msg.appendChild(error_msg_txt) ;
                  this.insertBefore(error_msg , input) ;
                  valid = false ;
                  }
               }
            else
               {
               if ( !fields.expression.value.test(input.value) )
                  {
                  var error_msg = document.createElement("span") ;
                  var error_msg_class = document.createAttribute("class") ;
                  error_msg_class.value = "message" ;
                  error_msg.setAttributeNode(error_msg_class) ;
                  var error_msg_txt = document.createTextNode(msg) ;
                  error_msg.appendChild(error_msg_txt) ;
                  this.insertBefore(error_msg , input) ;
                  valid = false ;
                  }
               }
            } ) ;
         } ) ;

      return valid ;
      } ,

   _saveFormData : function( form ) {
      var self = this ;
      var sameAsBilling = document.getElementById("same-as-billing") ;
      var visibleSet = form.getElementsByTagName("fieldset") ;

      visibleSet = Array.from(visibleSet) ;
      visibleSet.forEach(function( set ) {
         if ( set.id == "fieldset-billing" )
            {
            var name = document.getElementById("name").value ;
            var email = document.getElementById("email").value ;
            var city = document.getElementById("city").value ;
            var address = document.getElementById("address").value ;
            var zip = document.getElementById("zip").value ;
            var country = document.getElementById("country").value ;

            self.storage.setItem("billing-name" , name) ;
            self.storage.setItem("billing-email" , email) ;
            self.storage.setItem("billing-city" , city) ;
            self.storage.setItem("billing-address" , address) ;
            self.storage.setItem("billing-zip" , zip) ;
            self.storage.setItem("billing-country" , country) ;
            }
         else
            {
            if ( !sameAsBilling.checked )
               {
               var sName = document.getElementById("sname").value ;
               var sEmail = document.getElementById("semail").value ;
               var sCity = document.getElementById("scity").value ;
               var sAddress = document.getElementById("saddress").value ;
               var sZip = document.getElementById("szip").value ;
               var sCountry = document.getElementById("scountry").value ;

               self.storage.setItem("shipping-name" , sName) ;
               self.storage.setItem("shipping-email" , sEmail) ;
               self.storage.setItem("shipping-city" , sCity) ;
               self.storage.setItem("shipping-address" , sAddress) ;
               self.storage.setItem("shipping-zip" , sZip) ;
               self.storage.setItem("shipping-country" , sCountry) ;
               }
            }
         } ) ;
      }
   } ;

(function() {
   var shop = new Shop("site") ;
   })() ;
})() ;
