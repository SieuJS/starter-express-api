const searchM = require("../models/search.m");

module.exports = {
    search: async (req, res, next) => {
        const catid = req.query.catid;
        let name = req.query.keyword || "";
        let max = req.query.max? parseInt(req.query.max) : null;
        let min = req.query.min? parseInt(req.query.min): null;
        
        const products = await searchM.getProductbySearch(name, catid, min, max);
        
        //Chuyển tất cả Price sang Int do bên database lưu kiểu numeric
        const productsWithIntPrice = products.map(product => ({
            ...product,
            Price: parseInt(product.Price, 10)
        }));
        
        var result;

        let page = req.query.page;
        if (page!=null) {   //Nếu req muốn phân trang
            const productsPerPage = 9;  //Mặc định mỗi trang 9 sản phẩm. Có thể đổi nếu muốn
            //Lọc phần tử theo trang
            const startIndex = (page - 1) * productsPerPage;
            const endIndex = startIndex + productsPerPage;
            const rs = productsWithIntPrice.slice(startIndex,endIndex);
            //Tính tổng số trang
            const pages = Math.ceil(productsWithIntPrice.length / productsPerPage);
            result = {};
            result.products = rs;
            result.pages = pages;
        }
        else {
            result = productsWithIntPrice;
        }
        res.json(result);
    }
}