const request = require('supertest');
const should = require('should');
const app = require('../../app');
const models = require('../../models');
// const assert = require('assert')

// http://jeonghwan-kim.github.io/dev/2020/05/25/supertest.html
// function hasData(status, callback) { // 1번
//   return (res) => { // 2번
//     assert.equal(res.status, status); // 3번 
//     if (!body.hasOwnProperty('data')) throw new Error("missing data key"); // 4번    
//     callback(res.body.data); // 5번 
//   };
// }

/**
 * bcrypt 로직을 User로 옮긴 까닭에 User test case가 전체적으로 깨짐
 * bcrypt 로직을 옮기든가 Test case를 수정하든가 작업이 요구됨
 */

/**
 * 참조
 * http://jeonghwan-kim.github.io/dev/2020/05/25/supertest.html
 * https://shouldjs.github.io/
 */
describe('GET /users', () => {
  const users = [
    {
      email: 'ham@gmail.com',
      password: '1234',
      nickname: 'ham',
    },
    {
      email: 'sonaldo@gmail.com',
      password: '1234',
      nickname: 'son',
    },
    {
      email: 'messi@gmail.com',
      password: '1234',
      nickname: 'messi',
    },
  ];
  before(() => models.sequelize.sync({ force: true }));
  before(() => models.User.bulkCreate(users))
  describe('성공시', () => {
    it('상태 코드 200을 응답한다.', done => {
      request(app).get('/users').expect(200).end(done)
    })
    it('유저 객체를 담은 배열을 응답한다.', done => {
      request(app)
        .get('/users')
        .end((err, res) => {
          // key: value를 맞추기 위해 body.data로 테스트
          res.body.data.should.be.instanceOf(Array)
          done();
        });
      // .expect(200, {data: users}).end(done)
    });
    it('설정한 limit 개수만큼 응답한다.', done => {
      request(app)
        .get('/users?limit=2')
        .end((err, res) => {
          // console.log('data가 무엇인지:', res) // 아래처럼 날라옴
          //  body: { data: [ [Object], [Object] ] },
          res.body.data.should.have.lengthOf(2);
          done();
        })
    })
  })
  describe('실패시', () => {
    it('limit이 숫자형이 아니면 400을 응답한다.', done => {
      request(app).get('/users?limit=two').expect(400).end(done);
    });
  });
})

describe('GET /users/:id', () => {
  describe('성공시', () => {
    it('id가 1인 user 객체를 반환한다.', done => {
      request(app).get('/users/1')
        .end((err, res) => {
          res.body.data.should.have.property('id', 1)
          done();
        })
    })
  });
  describe('실패시', () => {
    it('라우팅 매개변수 숫자가 아닐 경우 400으로 응답한다.', done => {
      request(app)
        .get('/users/one')
        .expect(400).end(done);
    })
    it('id로 사용자를 찾을 수 없는 경우 404로 응답한다.', done => {
      request(app)
        .get('/users/999')
        .expect(404)
        .end(done)
    })
  });
});

describe('POST /users', () => {
  before(() => models.sequelize.sync({ force: true }));
  const users = [
    {
      email: 'haemil@gmail.com',
      password: '1234',
      nickname: 'ham',
    },
    {
      email: 'sonaldo@gmail.com',
      password: '1234',
      nickname: 'son',
    },
    {
      email: 'messi@gmail.com',
      password: '1234',
      nickname: 'messi',
    },
  ];
  before(() => models.User.bulkCreate(users))

  describe('성공시', () => {
    let body;
    const newUser = {
      "email": "hamburger@naver.com",
      "password": "1234",
      "nickname": "hamburger"
    }; 
    before(done => {
      request(app).post('/users')
        .send(newUser)
        .expect(201)
        .end((err, res) => {
          body = res.body;
          // console.log('body값..: ', body);
          done();
        })
    })    
    it('생성된 사용자 객체를 반환한다.', done => {
      // body값을 조회하면 생성한 데이터가 조회됨
      // console.log('body값..: ', body)     
      body.data.should.have.property('id')
      done();
    });
    it('입력한 nickname을 반환한다.', done => {
      // 아래는 should가 출력하는 메시지
      // operator: 'to have property nickname of \'hamburger\'' } }
      body.data.should.have.property('nickname', newUser.nickname)
      done()
    })
  })
  describe('실패시', () => {
    it('파라미터 누락시 400을 반환한다.', done => {
      const newUser = {
        "email": "",
        "password": "1234",
        "nickname": "hamburger"
      }; 
      request(app).post('/users').send(newUser).expect(400).end(done)
    });
    it('email이 중복일 경우 409를 반환한다.', done => {
      const newUser = {
        "email": "hamburger@naver.com",
        "password": "1234",
        "nickname": "hamburger"
      };
      request(app)
        .post('/users')
        .send(newUser)
        .expect(409)
        .end(done)
    })
  })
})

describe('PUT /users', () => {
  const users = [
    {
      email: 'haemil@gmail.com',
      password: '1234',
      nickname: 'ham',
    },
    {
      email: 'sonaldo@gmail.com',
      password: '1234',
      nickname: 'son',
    },
    {
      email: 'messi@gmail.com',
      password: '1234',
      nickname: 'messi',
    },
    {
      email: "hamburger@naver.com",
      password: "1234",
      nickname: "hamburger"
    }
  ];
  before(() => models.sequelize.sync({ force: true }));
  before(() => models.User.bulkCreate(users))

  describe('성공시', () => {
    // email은 변경을 허용하지 않는다.
    // nickname이 Unique한 값으로 설정되기 위해 Model에서 unique true
    it('변경된 nickname을 응답한다.', done => {
      const updatedUser = {
        email: "messi@gmail.com",
        password: "1234",
        nickname: "chicken"
      }
      request(app)
        .put('/users/3')
        .send(updatedUser)
        .end((err, res) => {          
          res.body.data.should.have.property('nickname', updatedUser.nickname)
          done();
        })
    });
    it('변경된 password를 응답한다.', done => {
      const updatedUser = {
        email: "messi@gmail.com",
        password: "12345",
        nickname: "messi"
      }
      request(app)
        .put('/users/3')
        .send(updatedUser)
        .end((err, res) => {          
          res.body.data.should.have.property('password', updatedUser.password)
          done()
        })
    })
  })
  describe('실패시', () => {
    // 정수가 아닌 id일 경우 400 응답    
    it('정수가 아닌 id일 경우 400 응답', done => {
      request(app).put('/users/two').expect(400).end(done);
    });
    it('입력된 값 중 nickname이 없을 경우 400 응답', done => {
      const updatedUser = {
        email: "chicken@naver.com",
        password: "1234",
        nickname: ""
      }
      request(app).put('/users/4')
        .send(updatedUser)
        .expect(400)
        .end(done)
    });
    it('없는 사용자일 경우 404 응답', done => {
      request(app)
        .put('/users/980')
        .expect(404)
        .end(done)
    });
    it('이름이 중복일 경우 409 응답', done => {
      const newUser = {
        email: "sonaldo@naver.com",
        password: "1234",
        nickname: "son"
      }
      request(app)
        .put('/users/3')
        .send(newUser)
        .expect(409)
        .end(done)
    })

  })
})

describe('DELETE /users/:id', () => {
  before(() => models.sequelize.sync({ force: true }));
  const users = [
    {
      email: 'haemil@gmail.com',
      password: '1234',
      nickname: 'ham',
    },
    {
      email: 'sonaldo@gmail.com',
      password: '1234',
      nickname: 'son',
    },
    {
      email: 'messi@gmail.com',
      password: '1234',
      nickname: 'messi',
    },
    {
      email: "hamburger@naver.com",
      password: "1234",
      nickname: "hamburger"
    }
  ];
  before(() => models.User.bulkCreate(users))
  describe('성공시', () => {
    it('사용자를 삭제할 경우 상태코드 204를 응답', done => {
      request(app)
        .delete('/users/4')
        .expect(204)
        .end(done)        
    })
  })
  describe('실패시', () => {
    it('매개변수 id가 숫자가 아닐 경우 400으로 응답', done => {
      request(app)
        .delete('/users/four')
        .expect(400)
        .end(done)
    });
    it('존재하지 않는 사용자일 경우 404로 응답', done => {
      request(app)
        .delete('/users/892')
        .expect(404)
        .end(done)
    });
  })
})
