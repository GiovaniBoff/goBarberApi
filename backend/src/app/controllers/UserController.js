import User from '../models/User';
import rsaPrivateKey from '../../config/isNotRsaPrivateKey.json';
import decrypt from '../service/decrypt';

class UserController {
  async store(req, res) {
    const userExists = await User.findOne({ where: { email: req.body.email } });

    const { password, email, name } = req.body;
    const decryptedPassword = decrypt(password);
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    await User.create({
      email,
      name,
      password: decryptedPassword,
    });
    return res.status(201).send();
  }

  async index(req, res) {
    try {
      const { name, email } = await User.findByPk(req.userId);
      return res.status(200).json({ name, email });
    } catch (error) {
      return res.status(401).json({ error });
    }
  }

  async update(req, res) {
    const { email, oldPassword } = req.body;

    const user = await User.findByPk(req.userId);

    if (email !== user.email) {
      const userExists = await User.findOne({
        where: { email },
      });

      if (userExists) {
        return res.status(400).json({ error: 'User already exists' });
      }
    }
    try {
      const decryptedPassword = await decrypt(oldPassword);
      const checkedPassword = await user.checkPassword(decryptedPassword);
      if (decryptedPassword && !checkedPassword) {
        return res.status(401).json({ error: 'Password does not match' });
      }
      const { name } = await user.update(req.body);
      return res.status(200).json({ name, email });
    } catch (er) {
      return res.status(401).json({ er });
    }
  }

  async getPublicKey(req, res) {
    res.status(200).json({ public_key: rsaPrivateKey.public_key });
  }
}

export default new UserController();
