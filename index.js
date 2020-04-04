///////////////////////////////////////////////////////////////////////////////
const db = require("./db");
const express = require("express");
const app = express();
const hb = require("express-handlebars");
////////////////////////////////////////////////////////////////////////////////
// require encryption
const bcrypt = require("./bcrypt");
////////////////////////////////////////////////////////////////////////////////
// require checking url
const { fixHttp } = require("./checkurl");
////////////////////////////////////////////////////////////////////////////////
///HANDLEBARS
app.engine("handlebars", hb());
app.set("view engine", "handlebars");
////////////////////////////////////////////////////////////////////////////////
///EXPRESS
app.use(express.static("./public"));
app.use(
    express.urlencoded({
        //to sie uruchamia przy kazdych ruchu // to lapie input urzytkownika
        extended: false // i robi z tego obj
    })
);

const cookieSession = require("cookie-session");
const csurf = require("csurf");
let secrets;

if (process.env.NODE_ENV === "production") {
    secrets = process.env;
} else {
    secrets = require("./secrets");
}

app.use(
    cookieSession({
        secret: secrets.SESSION_SECRET,
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);

///////////////////////////////////////////////////////////////////////////////
// COOKIE SAFETY
app.use(csurf());

app.use(function(req, res, next) {
    res.set("x-frame-options", "DENY");
    res.locals.csrfToken = req.csrfToken();
    next();
});

////////////////////////////////////////////////////////////////////////////////
// 1. REGISTER
app.get("/register", (req, res) => {
    console.log("*******************************GET/register");
    res.render("register", {
        layout: "main",
        loginRegister: true
    });
});

app.post("/register", (req, res) => {
    console.log("******************************POST/register");
    const first = req.body.first;
    const last = req.body.last;
    const email = req.body.email;
    var password = req.body.password;
    //console.log(first, last, email, password);
    if (
        first == "" ||
        last == "" ||
        email == "" ||
        password == "" ||
        first.startsWith(" ") ||
        last.startsWith(" ") ||
        email.startsWith(" ") ||
        password.startsWith(" ")
    ) {
        res.render("register", {
            layout: "main",
            emptyField: "emptyField",
            loginRegister: true
        });
    } else {
        bcrypt.hash(password).then(hashedPass => {
            console.log("hashedPass: ", hashedPass);
            db.addUsers(first, last, email, hashedPass)
                .then(results => {
                    req.session.userId = results.rows[0].id;
                    req.session.signed = false;
                    console.log("in addUsers");
                    console.log("req.session.userId: ", req.session.userId);
                    db.addProfile("", "", "", req.session.userId)
                        .then(() => {
                            res.redirect("/profile");
                        })
                        .catch(err => {
                            console.log("err in add emty user_profiles: ", err);
                        });
                })
                .catch(err => {
                    console.log("catch err in addUsers", err);
                    req.session.userId = undefined;
                    req.session.signed = undefined;
                    res.render("register", {
                        layout: "main",
                        err,
                        loginRegister: true
                    });
                });
        });
    }
});
////////////////////////////////////////////////////////////////////////////////
// 2. LOGIN

app.get("/login", (req, res) => {
    console.log("******************************GET/login");

    res.render("login", {
        layout: "main",
        loginRegister: true
    });
});

app.post("/login", (req, res) => {
    console.log("******************************POST/login");

    let email = req.body.email;
    let password = req.body.password;

    console.log("email: ", email);
    console.log("password", password);

    db.getUsers(email)
        .then(results => {
            // console.log("results.rows[0].password", results.rows[0].password);
            // console.log("email", email);
            bcrypt.compare(password, results.rows[0].password).then(result => {
                // console.log("compareing result: ", result);
                if (result) {
                    req.session.userId = results.rows[0].id;
                    console.log(" user id in cookie: ", results.rows[0].id);

                    db.checkSign(req.session.userId)
                        .then(val => {
                            console.log("val.rows.length: ", val.rows.length);
                            if (val.rows.length > 0) {
                                console.log("there is signature");
                                req.session.signed = true;
                                db.getName(req.session.userId)
                                    .then(name => {
                                        let first = name.rows[0].first;
                                        let last = name.rows[0].last;
                                        let sign = val.rows[0].signature;
                                        console.log("sign: ", sign);
                                        db.getAll().then(fromSignatures => {
                                            var numOfSigns =
                                                fromSignatures.rows.length;
                                            console.log(numOfSigns);
                                            res.render("thanks", {
                                                layout: "main",
                                                first,
                                                last,
                                                sign,
                                                numOfSigns,
                                                moreCoding: "blabla"
                                            });
                                        });
                                    })
                                    .catch(err => {
                                        res.render("petition", {
                                            err
                                        });
                                    });
                            } else {
                                console.log("rows smaller 0");
                                req.session.signed = false;
                                res.redirect("/petition");
                            }
                        })
                        .catch(err => {
                            console.log("checkSign err:", err);
                        });
                } else {
                    res.render("login", {
                        layout: "main",
                        loginRegister: true,
                        err: "error"
                    });
                }
            });
        })
        .catch(err => {
            res.render("login", {
                layout: "main",
                err,
                loginRegister: true
            });
        });
});
////////////////////////////////////////////////////////////////////////////////
// 3. PROFILE
app.get("/profile", (req, res) => {
    console.log("**********************************GET/profile");
    if (req.session.userId == undefined) {
        res.redirect("/register");
    } else {
        res.render("profile", {
            layout: "main",
            someInfo: "some info"
        });
    }
});

app.post("/profile", (req, res) => {
    console.log("**********************************POST/profile");
    console.log("req.session.userId: ", req.session.userId);
    let age = req.body.age;
    let city = req.body.city;
    console.log("un fixHttp: ", req.body.url);
    let url = fixHttp(req.body.url);
    console.log("fixHttp: ", url);
    // console.log("age, city, url: ", age, city, url);
    db.addProfile(age, city, url, req.session.userId)
        .then(() => {
            res.redirect("/petition");
        })
        .catch(err => {
            console.log("addProfile err: ", err);
            res.render("profile", {
                err
            });
        });
});
////////////////////////////////////////////////////////////////////////////////
// 4. PETITION
app.get("/petition", (req, res) => {
    console.log("********************************GET/petition");
    console.log("req.session.userId: ", req.session.userId);
    console.log("req.session.signed: ", req.session.signed);
    if (req.session.signed == false && req.session.userId) {
        console.log("req.session.signed: ", req.session.signed);

        db.getName(req.session.userId)
            .then(result => {
                let first = result.rows[0].first;
                let last = result.rows[0].last;
                console.log("first last", first);
                console.log(last);
                res.render("petition", {
                    layout: "main",
                    first,
                    last,
                    moreCoding: "more"
                });
            })
            .catch(err => {
                res.render("petition", {
                    err
                });
            });
    } else if (req.session.signed == true) {
        res.redirect("/thanks");
    } else {
        req.session.signed = undefined;
        req.session.userId = undefined;
        res.redirect("/register");
    }
});

app.post("/petition", (req, res) => {
    console.log("********************************POST/petition");
    var sign = req.body.sign;
    console.log("signature: ", sign);
    if (sign !== "empty") {
        req.session.userId;
        req.session.signed = true;
        db.addData(sign, req.session.userId)
            .then(results => {
                console.log("rows in add data: ", results.rows[0]);

                db.getName(req.session.userId)
                    .then(result => {
                        console.log("results.rows[0]", results.rows[0]);
                        let first = result.rows[0].first;
                        let last = result.rows[0].last;
                        db.getAll().then(fromSignatures => {
                            let numOfSigns = fromSignatures.rows.length;
                            console.log(numOfSigns);
                            // res.redirect("/signers");
                            res.render("thanks", {
                                layout: "main",
                                first,
                                last,
                                sign,
                                numOfSigns,
                                moreCoding: "blabla"
                            });
                        });
                    })
                    .catch(err => {
                        res.render("petition", {
                            err
                        });
                    });
            })
            .catch(err => {
                res.render("petition", {
                    err
                });
            });
    } else {
        req.session.signed = false;
        db.getName(req.session.userId)
            .then(result => {
                let first = result.rows[0].first;
                let last = result.rows[0].last;
                console.log("first last", first);
                console.log(last);
                res.render("petition", {
                    layout: "main",
                    first,
                    last,
                    err: "err"
                });
            })
            .catch(err => {
                res.render("petition", {
                    err
                });
            });
    }
});
////////////////////////////////////////////////////////////////////////////////
// 5. THANKS
app.get("/thanks", (req, res) => {
    console.log("******************************GET/thanks");

    db.checkSign(req.session.userId)
        .then(val => {
            console.log("val.rows.length: ", val.rows.length);
            if (val.rows.length > 0) {
                db.getName(req.session.userId)
                    .then(name => {
                        let first = name.rows[0].first;
                        let last = name.rows[0].last;
                        let sign = val.rows[0].signature;

                        db.getAll().then(fromSignatures => {
                            var numOfSigns = fromSignatures.rows.length;
                            res.render("thanks", {
                                layout: "main",
                                first,
                                last,
                                sign,
                                numOfSigns,
                                moreCoding: "blabla"
                            });
                        });
                    })
                    .catch(err => {
                        res.render("petition", {
                            err
                        });
                    });
            } else {
                console.log("rows smaller 0");
                req.session.signed = false;
                res.redirect("/petition");
            }
        })
        .catch(err => {
            console.log("checkSign err:", err);
            req.render("petition");
        });
});
////////////////////////////////////////////////////////////////////////////////
// 6. SIGNERS
app.get("/signers", (req, res) => {
    console.log(
        "GET/signers****************************************************"
    );
    console.log("req.session.signed: ", req.session.signed);
    if (req.session.userId == undefined) {
        req.session.signed == false;
        res.redirect("/register");
    } else if (req.session.signed == false) {
        res.redirect("/petition");
    } else {
        db.getAllInfo()
            .then(results => {
                let allInfo = results.rows;
                let numOfSigns = results.rows.length;
                console.log("allInfo: ", allInfo);
                res.render("signers", {
                    allInfo,
                    numOfSigns,
                    moreCoding: "blabla"
                });
            })
            .catch(err => {
                console.log("err in /signer: ", err);
            });
    }
});

app.get("/sigers", (req, res) => {
    db.getAllInfo()
        .then(datas => {
            let data = datas.rows;
            console.log("data.rows", data.rows);
            res.render("sigers", {
                layout: "main",
                data
            });
        })
        .catch(err => console.log("err: ", err));
});
///////////////////////////////////////////////////////////////////////////////
// 7. DELETE SIGNATURE BUTTON IN THANKS AND PROFILE / DELETE ACCOUNT
app.post("/delete", (req, res) => {
    console.log("***********************************************POST/delete");

    db.deleteSignature(req.session.userId)
        .then(() => {
            req.session.signed = false;
            res.redirect("/petition");
        })
        .catch(err => {
            console.log("err in deleting signature: ", err);
        });
});

app.post("/deleteaccount", (req, res) => {
    console.log(
        "***********************************************POST/deleteaccount" //zrobic z alertem czy na pewno chcesz usunac profil
    );

    db.deleteSignature(req.session.userId)
        .then(() => {
            db.deleteProfile(req.session.userId)
                .then(() => {
                    db.deleteUser(req.session.userId)
                        .then(() => {
                            req.session.signed = undefined;
                            req.session.userId = undefined;
                            res.render("deleteaccount");
                        })
                        .catch(err => {
                            console.log(
                                "err in /deleteaccount deleting profile: ",
                                err
                            );
                        });
                })
                .catch(err => {
                    console.log(
                        "err in /deleteaccount deleting profile: ",
                        err
                    );
                });
        })
        .catch(err => {
            console.log("err in /deleteaccount deleting signature: ", err);
        });
});

app.get("/deleteaccount", (req, res) => {
    // if (req.session.userId == undefined) {
    res.redirect("/register");
    // } else {
    //     res.redirect("/edit");
    // }
});

///////////////////////////////////////////////////////////////////////////////
// 8. EDIT
app.get("/edit", (req, res) => {
    console.log("*************************************GET/edit");
    console.log(req.session.userId);
    if (req.session.userId == undefined) {
        res.redirect("/register");
    } else if (req.session.signed == false) {
        db.getAllForEdit(req.session.userId)
            .then(allInfo => {
                //         console.log("results for specific users: ", result);
                let age = allInfo.rows[0].age;
                let city = allInfo.rows[0].city;

                console.log("allInfo.rows[0].url: ", allInfo.rows[0].url);
                let url = fixHttp(allInfo.rows[0].url);
                console.log("url Fixed: ", url);

                let password = allInfo.rows[0].password;
                let first = allInfo.rows[0].first;
                let last = allInfo.rows[0].last;
                let email = allInfo.rows[0].email;
                console.log("all info in /edits: ", allInfo);

                res.render("edit", {
                    layout: "main",
                    age,
                    city,
                    url,
                    password,
                    first,
                    last,
                    email
                });
            })
            .catch(err => {
                console.log("err in /profile/edit: ", err);
            });
    } else {
        db.getAllForEdit(req.session.userId)
            .then(allInfo => {
                let age = allInfo.rows[0].age;
                let city = allInfo.rows[0].city;

                console.log("allInfo.rows[0].url: ", allInfo.rows[0].url);
                console.log(allInfo.rows[0].url.startsWith("https://"));
                let url = fixHttp(allInfo.rows[0].url);
                console.log("url Fixed: ", url);

                let password = allInfo.rows[0].password;
                let first = allInfo.rows[0].first;
                let last = allInfo.rows[0].last;
                let email = allInfo.rows[0].email;
                db.checkSign(req.session.userId)
                    .then(val => {
                        let sign = val.rows[0].signature;
                        //            console.log("get sign in /edit: ", sign);

                        res.render("edit", {
                            layout: "main",
                            sign,
                            age,
                            city,
                            url,
                            password,
                            first,
                            last,
                            email
                        });
                    })
                    .catch(err => {
                        console.log("er in check sign in /edit: ", err);
                    });
            })
            .catch(err => {
                console.log("err in /edit: ", err);
            });
    }
});

app.post("/edit", (req, res) => {
    console.log("**************************POST/edit");
    console.log("req.session.userId: ", req.session.userId);
    let age = req.body.age;
    let city = req.body.city;
    let url = fixHttp(req.body.url);
    let password = req.body.password;
    let first = req.body.first;
    let last = req.body.last;
    let email = req.body.email;

    if (
        first == "" ||
        last == "" ||
        email == "" ||
        // password == "" ||
        first.startsWith(" ") ||
        last.startsWith(" ") ||
        email.startsWith(" ") ||
        password.startsWith(" ")
    ) {
        res.redirect("/edit");
    } else {
        db.getAllForEdit(req.session.userId)
            .then(() => {
                if (password) {
                    bcrypt.hash(password).then(hashedPass => {
                        db.updateFirstLastPasswordEmail(
                            first,
                            last,
                            email,
                            hashedPass,
                            req.session.userId
                        )
                            .then(() => {
                                db.addOrUpdateAgeCityHomepage(
                                    age,
                                    city,
                                    url,
                                    req.session.userId
                                )
                                    .then(() => {
                                        res.redirect("/petition");
                                    })
                                    .catch(err => {
                                        console.log(
                                            "err in updating city and password: ",
                                            err
                                        );
                                        res.redirect("/edit");
                                    });
                                //
                            })
                            .catch(err => {
                                console.log("err in changing password: ", err);
                                db.getAllForEdit(req.session.userId)
                                    .then(allInfo => {
                                        let age = allInfo.rows[0].age;
                                        let city = allInfo.rows[0].city;
                                        let url = fixHttp(allInfo.rows[0].url);
                                        let password = allInfo.rows[0].password;
                                        let first = allInfo.rows[0].first;
                                        let last = allInfo.rows[0].last;
                                        let email = allInfo.rows[0].email;
                                        db.checkSign(req.session.userId)
                                            .then(val => {
                                                let sign =
                                                    val.rows[0].signature;
                                                console.log(
                                                    "get sign in /edit: ",
                                                    sign
                                                );

                                                res.render("edit", {
                                                    layout: "main",
                                                    sign,
                                                    age,
                                                    city,
                                                    url,
                                                    password,
                                                    first,
                                                    last,
                                                    email,
                                                    emailUsed: "err"
                                                });
                                            })
                                            .catch(err => {
                                                console.log(
                                                    "er in check sign in /edit: ",
                                                    err
                                                );
                                            });
                                    })
                                    .catch(err => {
                                        console.log("err in /edit: ", err);
                                    });
                            });
                    });
                } else {
                    db.updateFirstLastNoPasswordEmail(
                        first,
                        last,
                        email,
                        req.session.userId
                    )
                        .then(() => {
                            db.addOrUpdateAgeCityHomepage(
                                age,
                                city,
                                url,
                                req.session.userId
                            )
                                .then(() => {
                                    res.redirect("/thanks");
                                })
                                .catch(err => {
                                    console.log(err);
                                    res.redirect("/edit");
                                });
                            //
                        })
                        .catch(err => {
                            console.log(
                                "err in updateFirstLastPasswordEmail: ",
                                err
                            );
                            db.getAllForEdit(req.session.userId)
                                .then(allInfo => {
                                    let age = allInfo.rows[0].age;
                                    let city = allInfo.rows[0].city;
                                    let url = fixHttp(allInfo.rows[0].url);
                                    let password = allInfo.rows[0].password;
                                    let first = allInfo.rows[0].first;
                                    let last = allInfo.rows[0].last;
                                    let email = allInfo.rows[0].email;
                                    db.checkSign(req.session.userId)
                                        .then(val => {
                                            let sign = val.rows[0].signature;
                                            console.log(
                                                "get sign in /edit: ",
                                                sign
                                            );

                                            res.render("edit", {
                                                layout: "main",
                                                sign,
                                                age,
                                                city,
                                                url,
                                                password,
                                                first,
                                                last,
                                                email,
                                                emailUsed: "err"
                                            });
                                        })
                                        .catch(err => {
                                            console.log(
                                                "er in check sign in /edit: ",
                                                err
                                            );
                                        });
                                })
                                .catch(err => {
                                    console.log("err in /edit: ", err);
                                });
                        });
                }
            })
            .catch(err => {
                "err in get all for edit: ", err;
            });
    }
});
////////////////////////////////////////////////////////////////////////////////
// 9.  / ROUTE
app.get("/", (req, res) => {
    // console.log("reg.session berfore settiong:", req.session);
    // req.session.peppermint = "<3";
    // console.log("reg.session after settiong:", req.session);
    res.redirect("/register");
});
////////////////////////////////////////////////////////////////////////////////
// 10. CITIES DYNAMIC ROUTE
app.get("/signers/:city", (req, res) => {
    console.log("*************************GET/signers/:city");
    var city = req.params.city;
    console.log("cities!!!!: ", city);

    if (req.session.userId && req.session.signed) {
        db.getPeopleByCity(city)
            .then(result => {
                console.log("getPeopleByCity: ", result.rows);
                let city = result.rows;
                let cityOne = result.rows[0].city;
                res.render("city", {
                    city,
                    cityOne
                });
            })
            .catch(err => {
                console.log("err in getPeopleByCity: ", err);
            });
    } else if (req.session.userId == undefined) {
        req.session.signed = undefined;
        res.redirect("/register");
    } else {
        res.redirect("/petition");
    }
});

app.listen(process.env.PORT || 8090, () => console.log("running"));
////////////////////////////////////////////////////////////////////////////////
// 11. LOGOUT
app.get("/logout", (req, res) => {
    req.session.userId = undefined;
    req.session.signed = undefined;
    res.redirect("/login");
});
