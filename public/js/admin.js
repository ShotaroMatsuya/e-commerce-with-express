const deleteProduct = btn =>{
    const prodId = btn.parentNode.querySelector('[name=productId').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf').value;

    const productElement = btn.closest('article');//closestはancestorDOMを参照

    fetch('/admin/product/' + prodId,{
        method:'DELETE',
        headers:{
            'csrf-token':csrf//csurfで決められているkeyをセット
        }
    }).then(result =>{
        return result.json();
    }).then(data =>{
        console.log(data);
        productElement.parentNode.removeChild(productElement);
    }).catch(err =>{
        console.log(err);
    });
    
    
};

