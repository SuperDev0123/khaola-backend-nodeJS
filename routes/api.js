const express = require("express");
const { catchErrors } = require("../handlers/errorHandlers");

const router = express.Router();
const { isValidToken, isValidProvider, isValidClient, isValidAdmin } = require("../controllers/authController");

const adminController = require("../controllers/adminController");
const clientController = require("../controllers/clientController");

const providerController = require("../controllers/providerController");
const productController = require("../controllers/productController");
const authControllerDemo = require("../controllers/authControllerDemo");

//_______________________________ Admin management_______________________________

router.route("/admin/create").post(catchErrors(adminController.create));
router.route("/admin/read/:id").get(catchErrors(adminController.read));
router.route("/admin/update/:id").patch(catchErrors(adminController.update));
router.route("/admin/delete/:id").delete(catchErrors(adminController.delete));
router.route("/admin/search").get(catchErrors(adminController.search));
router.route("/admin/list").get(catchErrors(adminController.list));
router.route("/admin/reserve/list").get(isValidAdmin, catchErrors(adminController.reserve_list));
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
router.route("/client/my_list").get(isValidProvider, catchErrors(clientController.myList));
router.route("/client/verify_list").get(isValidAdmin, catchErrors(clientController.verifyList));
router.route("/client/register").post(isValidProvider, catchErrors(clientController.registerClient));
router.route("/client/reset_verify").post(isValidAdmin, catchErrors(clientController.reset_verify));
router.route("/client/reset_status").post(isValidProvider, catchErrors(clientController.reset_status));
router.route("/client/reserve/list").get(isValidClient, catchErrors(clientController.reserve_list));
router.route("/client/reserve_call").post(isValidClient, catchErrors(clientController.reserve_call));
router.route("/client/verify").post(isValidClient, catchErrors(clientController.verify_client));
router.route("/client/is_verify").get(isValidClient, catchErrors(clientController.is_verify));

//_____________________________________ API for providers ___________________________
router.route("/provider/create").post(catchErrors(providerController.create));
router.route("/provider/read/:id").get(catchErrors(providerController.read));
router.route("/provider/update/:id").patch(catchErrors(providerController.update));
router.route("/provider/delete/:id").delete(catchErrors(providerController.delete));
router.route("/provider/search").get(catchErrors(providerController.search));
router.route("/provider/list").get(isValidAdmin, catchErrors(providerController.list));

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
