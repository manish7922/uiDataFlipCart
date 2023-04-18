var express = require("express");
let jwt = require("jsonwebtoken");
let passport = require("passport");
let JwtStrategy = require("passport-jwt").Strategy;
let ExtarctJWT = require("passport-jwt").ExtractJwt;
var app = express();
app.use(express.json());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept,Authorization,WWW-Authenticate"
  );

  res.header("Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, OPTIONS");
  next();
});

const {
  mobiles,
  mobilesMatch,
  pinCodesData,
  reviewsData,
  loginData,
  wishList,
  orders,
} = require("./data");

app.use(passport.initialize());
const params = {
  jwtFromRequest: ExtarctJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: "jwtsecret238988945452",
};

const jwtExpirySecond = 8000000000000000;

let strategyALL = new JwtStrategy(params, function (token, done) {
  console.log("In JWTStrategy--All", token.id);
  let user = loginData.find((u) => u.id === token.id);
  console.log("user", user);
  if (!user) {
    return done(null, false, { message: "Incorrect username and password" });
  } else {
    return done(null, user);
  }
});

console.log(strategyALL);

let strategyAdmin = new JwtStrategy(params, function (token, done) {
  console.log("In JWTStrategy-Admin", token);
  let user = loginData.find((u) => u.id === token.id);

  console.log("user", user);
  if (!user) {
    return done(null, false, { message: "Incorrect username and password" });
  } else if (user.role !== "admin") {
    return done(null, false, { message: "you do not have admin role" });
  } else {
    return done(null, user);
  }
});

passport.use("roleAll", strategyALL);
passport.use("roleAdmin", strategyAdmin);

const port = process.env.PORT || 2410;

app.listen(port, () => console.log(`Node app listening on port ${port}!`));

app.post("/user", function (req, res) {
  let { email, password } = req.body;
  console.log(email, password);
  let user = loginData.find(
    (u) => u.email === email && u.password === password
  );
  console.log(user);
  if (user) {
    console.log(user.firstname);
    let payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.firstname,
    };
    let payload1 = { id: user.id };
    let token = jwt.sign(payload1, params.secretOrKey,{
      algorithm: "HS256",
      expiresIn: jwtExpirySecond,
    });
    console.log(token);
    res.send({ token: "bearer  " + token, ...payload });
  } else res.sendStatus(401);
});

app.get("/products", function (req, res) {
  res.send(mobilesMatch);
});

app.get("/products/:category", function (req, res) {
  let category = req.params.category;
  // let brand=req.params.brand;
  let q = req.query.q;
  const filterProduct = mobilesMatch.filter(function (product) {
    return product.category === category;
  });

  console.log(filterProduct);
  res.send(filterProduct);
});

app.get("/deals", function (req, res) {
  let product = mobilesMatch.slice(0, 16);
  res.send(product);
});

app.get("/productsData", function (req, res) {
  let brand = req.params.brand;
  let assured = req.query.assured;
  let ram = req.query.ram;
  let rating = req.query.rating;
  let price = req.query.price;
  let q = req.query.q;
  let arr1 = mobilesMatch;

  if (ram) {
    // console.log(ram);
    // let ram1=ram.substring(2,3);
    // console.log(ram1);
    // arr1 = arr1.filter(n => n.ram >= +ram1);

    if (ram === ">=6") {
      arr1 = arr1.filter((n) => n.ram >= 6);
    } else if (ram === "<=4") {
      arr1 = arr1.filter((n) => n.ram <= 4);
    } else if (ram === "<=3") {
      arr1 = arr1.filter((n) => n.ram <= 3);
    } else if (ram === "<=2") {
      arr1 = arr1.filter((n) => n.ram <= 2);
    }
  }
  if (brand) {
    console.log(brand);
    arr1 = arr1.filter((n) => n.brand === brand);
  }
  // if(brand!= undefined)
  // {
  //   brand= brand.split(',');
  //   //console.log(language);
  //   let arr2= arr1.filter(obj=>
  //     brand.find(obj1=> obj1===obj.brand)
  //  );
  //  arr1= arr2;
  // }

  if (rating) {
    arr1 = arr1.filter((n) => n.rating >= +rating);
  }
  if (price) {
    const priceRange = price.split("-");
    if (priceRange.length === 1) {
      arr1 = arr1.filter((n) => n.price >= +priceRange[0]);
    } else if (priceRange.length === 2) {
      const minPrice = +priceRange[0];
      const maxPrice = +priceRange[1];
      arr1 = arr1.filter((n) => n.price >= minPrice && n.price <= maxPrice);
    }
  }

  console.log(arr1);
  res.send(arr1);
});

app.get(
  "/wishList",
  passport.authenticate("roleAll", { session: false }),
  function (req, res) {
    console.log("hiuuuu");
    console.log(wishList, req.id);
    try {
      res.send(wishList);
    } catch (error) {
      console.log(error);
      if (error.response && error.response.status === 401) {
        res.status(401).send("Unauthorized");
      } else {
        res.send(error);
      }
    }
  }
);

app.post(
  "/wishList",
  passport.authenticate("roleAll", { session: false }),
  function (req, res) {
    let body = req.body;
    console.log(body, "body data");
    wishList.push(body);
    res.send(body);
  }
);

app.get("/product/:productid", function (req, res) {
  let productid = req.params.productid;
  console.log(productid);
  let filterData = mobilesMatch.find((n) => n.id === productid);
  console.log(filterData);
  res.send(filterData);
});

// baseurl/pincode/:pincode/:productId
// baseurl/reviews/:productId

app.get("/baseURl/products/:pincode/:prductID", function (req, res) {
  let pincode = +req.params.pincode;
  if (pincode) {
    let data = pinCodesData.find((n) => n.pincode === pincode);
    console.log(data);
    let prductID = req.params.prductID;
    console.log(prductID);
    let data1 = data.mobileList.find((n) => n.id === prductID);
    console.log(data1);
    res.send(data1);
  }
});

app.get("/reviews/:productId", function (req, res) {
  let prductID = req.params.productId;
  let data = reviewsData.find((n) => n.mobileId === prductID);
  let data1 = { list: data.ratings };
  res.send(data1);
});

app.get("/mobile/:brand", function (req, res) {
  let brand = req.params.brand;
  let data = mobiles.find((n) => n.brand === brand);
  console.log(data);
  res.send(data);
});

app.get(
  "/orders",
  passport.authenticate("roleAll", { session: false }),
  function (req, res) {
    console.log(orders);
    const singleArray = orders.flat();
    res.json(singleArray);
  }
);

app.post(
  "/orders",
  passport.authenticate("roleAll", { session: false }),
  function (req, res) {
    let body = req.body;
    console.log("body", body);
    orders.push(body);
    res.send("success");
  }
);

app.get(
  "/user",
  passport.authenticate("roleAll", { session: false }),
  function (req, res) {
    console.log("IN GET /user", req.user);
    res.send(req.user);
  }
);

app.get(
  "/products",
  passport.authenticate("roleAdmin", { session: false }),
  function (req, res) {
    console.log(mobilesMatch);
    res.send(mobilesMatch);
  }
);
app.post(
  "/products",
  passport.authenticate("roleAdmin", { session: false }),
  function (req, res) {
    let body = req.body;
    console.log("body", body);
    mobilesMatch.push(body);
    res.send(body);
  }
);

app.put(
  "/products/:id",
  passport.authenticate("roleAdmin", { session: false }),
  function (req, res) {
    let id = req.params.id;
    console.log(id);
    let body = req.body;
    let index = mobilesMatch.findIndex((n) => n.id === id);
    console.log(index);
    let updateProducts = { ...body };
    if (index >= 0) {
      mobilesMatch[index] = updateProducts;
      console.log(updateProducts);
      res.send(updateProducts);
    } else {
      res.status(404).send("data not found");
    }
  }
);

app.delete("/wishlist/:id",  passport.authenticate("roleAdmin", { session: false }),
function (req, res) {
  let id = req.params.id;
    let index=wishList.findIndex((n)=>n.id===id);
  console.log(index);
  if(index>=0){
      let deleteData=wishList.splice(index,1);
      res.send(deleteData);
  }else{
      res.status(404).send("data not found");
  }
})

