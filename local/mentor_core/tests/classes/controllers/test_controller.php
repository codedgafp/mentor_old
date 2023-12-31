<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

namespace local_mentor_core;

defined('MOODLE_INTERNAL') || die();

use moodle_exception;

/**
 * Controller for unit test
 *
 * @package    local_mentor_core
 * @copyright  2022 Edunao SAS (contact@edunao.com)
 * @author     remi <remi.colet@edunao.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class test_controller extends \local_mentor_core\controller_base {
    /**
     * Execute action
     *
     * @return array
     * @throws \moodle_exception
     */
    public function execute() {
        $action = $this->get_param('action');

        switch ($action) {
            case 'test_action' :
                return $this->success(self::test_action());
            default:
                return $this->success(self::$action());
        }
    }

    public static function test_action() {
        return true;
    }
}
