const express = require("express");
const { catchErrors } = require("../handlers/errorHandlers");

const router = express.Router();
const { isValidToken, isValidProvider, isValidClient } = require("../controllers/authController");

const adminController = require("../controllers/adminController");
const clientController = require("../controllers/clientController");

const leadController = require("../controllers/leadController");
const productController = require("../controllers/productController");
const authControllerDemo = require("../controllers/authControllerDemo");

//_______________________________ Admin management_______________________________

router.route("/admin/create").post(catchErrors(adminController.create));
router.route("/admin/read/:id").get(catchErrors(adminController.read));
router.route("/admin/update/:id").patch(catchErrors(adminController.update));
router.route("/admin/delete/:id").delete(catchErrors(adminController.delete));
router.route("/admin/search").get(catchErrors(adminController.search));
router.route("/admin/list").get(catchErrors(adminController.list));

router
  .route("/admin/password-update/:id")
  .patch(catchErrors(adminController.updatePassword));
//list of admins ends here

//_____________________________________ API for clients __________________________
router.route("/client/create").post(catchErrors(clientController.create));
router.route("/client/read/:id").get(catchErrors(clientController.read));
router.route("/client/update/:id").patch(catchErrors(clientController.update));
router.route("/client/delete/:id").delete(catchErrors(clientController.delete));
router.route("/client/search").get(catchErrors(clientController.search));
router.route("/client/list").get(catchErrors(clientController.list));
router.route("/client/reset_verify").post(isValidProvider, catchErrors(authControllerDemo.reset_verify));
router.route("/client/reset_status").post(isValidProvider, catchErrors(authControllerDemo.reset_status));
router.route("/client/reserve/list").get(isValidClient, catchErrors(authControllerDemo.reserve_list));
router.route("/client/reserve_call").post(isValidClient, catchErrors(authControllerDemo.reserve_call));
router.route("/client/verify").post(isValidClient, catchErrors(authControllerDemo.verify_client));
router.route("/client/is_verify").get(isValidClient, catchErrors(authControllerDemo.is_verify));

//_____________________________________ API for leads ___________________________
router.route("/lead/create").post(catchErrors(leadController.create));
router.route("/lead/read/:id").get(catchErrors(leadController.read));
router.route("/lead/update/:id").patch(catchErrors(leadController.update));
router.route("/lead/delete/:id").delete(catchErrors(leadController.delete));
router.route("/lead/search").get(catchErrors(leadController.search));
router.route("/lead/list").get(catchErrors(leadController.list));

//_____________________________________ API for products ___________________________
router.route("/product/create").post(catchErrors(productController.create));
router.route("/product/read/:id").get(catchErrors(productController.read));
router
  .route("/product/update/:id")
  .patch(catchErrors(productController.update));
router
  .route("/product/delete/:id")
  .delete(catchErrors(productController.delete));
router.route("/product/search").get(catchErrors(productController.search));
router.route("/product/list").get(catchErrors(productController.list));

module.exports = router;
